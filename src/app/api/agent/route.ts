import { NextResponse, type NextRequest } from "next/server";

import { runAgent, streamAgent } from "@/lib/ai/agent";
import { createAgentStream } from "@/lib/ai/stream";
import { withApiAnalytics } from "@/lib/analytics/server";
import type { AgentMessage, AgentRequest } from "@/types/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isValidMessage = (message: AgentMessage): boolean => {
  return (
    !!message &&
    typeof message.role === "string" &&
    typeof message.content === "string"
  );
};

const postHandler = async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as AgentRequest | null;

  if (!body?.messages || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Missing required 'messages' array in request body." },
      { status: 400 },
    );
  }

  if (!body.messages.every((message) => isValidMessage(message))) {
    return NextResponse.json(
      { error: "Invalid message format in request body." },
      { status: 400 },
    );
  }

  const location = body.location ?? "unknown";

  const wantsStream =
    body.stream ??
    req.headers.get("accept")?.includes("text/event-stream") ??
    false;

  if (wantsStream) {
    const stream = createAgentStream(() =>
      streamAgent({
        messages: body.messages,
        location,
      }),
    );

    const headers = new Headers();
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");

    return new NextResponse(stream, { status: 200, headers });
  }

  try {
    const response = await runAgent({
      messages: body.messages,
      location,
    });
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Agent request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const POST = withApiAnalytics(
  {
    route: "/api/agent",
    actorType: "public",
  },
  postHandler,
);
