import { NextResponse, type NextRequest } from "next/server";

import { logEvent } from "@/lib/data/events";

const DEFAULT_BASE_URL = "https://api.mathislambert.fr";
const upstreamBaseUrl = (
  process.env.ML_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/$/, "");
const upstreamApiKey = process.env.ML_API_KEY;
const upstreamModel = process.env.LLM_MODEL_NAME || "openai/gpt-oss-120b";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        messages?: Array<{ role: string; content: string }>;
        location?: string;
        stream?: boolean;
      }
    | null;

  if (!body?.messages || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Missing required 'messages' array in request body." },
      { status: 400 },
    );
  }

  if (!upstreamApiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: ML_API_KEY is not set." },
      { status: 500 },
    );
  }

  const location = body.location ?? "unknown";
  await logEvent("chat_completion", {
    location,
    messages: body.messages,
  });

  const wantsStream =
    body.stream ??
    req.headers.get("accept")?.includes("text/event-stream") ??
    false;

  const upstreamPayload = {
    model: upstreamModel,
    messages: body.messages,
    stream: wantsStream,
    metadata: { location },
  };

  const upstreamResponse = await fetch(
    `${upstreamBaseUrl}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: wantsStream ? "text/event-stream" : "application/json",
        "X-ML-API-Key": upstreamApiKey,
      },
      body: JSON.stringify(upstreamPayload),
    },
  );

  if (!upstreamResponse.ok) {
    let errorDetails: unknown;
    try {
      errorDetails = await upstreamResponse.json();
    } catch {
      errorDetails = await upstreamResponse.text().catch(() => "");
    }
    return NextResponse.json(
      {
        error: "Upstream chat completion request failed.",
        details: errorDetails,
      },
      { status: upstreamResponse.status },
    );
  }

  if (wantsStream) {
    if (!upstreamResponse.body) {
      return NextResponse.json(
        { error: "Upstream response did not contain a stream." },
        { status: 502 },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  }

  const result = await upstreamResponse.json();
  return NextResponse.json(result, { status: upstreamResponse.status });
}
