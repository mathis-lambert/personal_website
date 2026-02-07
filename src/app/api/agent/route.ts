import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { runAgent, streamAgent } from "@/lib/ai/agent";
import { createAgentStream } from "@/lib/ai/stream";
import { withApiAnalytics } from "@/lib/analytics/server";
import {
  completeTurn,
  failTurn,
  startTurn,
  type StartedTurn,
} from "@/lib/analytics/chatObservability";
import type {
  AgentMessage,
  AgentRequest,
  AgentResponse,
  AgentStreamEvent,
} from "@/types/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isValidMessage = (message: AgentMessage): boolean => {
  return (
    !!message &&
    typeof message.role === "string" &&
    typeof message.content === "string"
  );
};

const safeCompleteTurn = async (input: {
  startedTurn: StartedTurn;
  response: AgentResponse;
  durationMs: number;
  assistantMessage?: string;
}) => {
  try {
    await completeTurn({
      turnId: input.startedTurn.turnId,
      response: input.response,
      durationMs: input.durationMs,
      assistantMessage: input.assistantMessage,
    });
  } catch (error) {
    console.error("Failed to complete chat turn log", error);
  }
};

const safeFailTurn = async (input: {
  startedTurn: StartedTurn;
  error: unknown;
  durationMs: number;
  partialAssistantMessage?: string;
}) => {
  try {
    await failTurn({
      turnId: input.startedTurn.turnId,
      error: input.error,
      durationMs: input.durationMs,
      partialAssistantMessage: input.partialAssistantMessage,
    });
  } catch (loggingError) {
    console.error("Failed to persist failed chat turn log", loggingError);
  }
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
  const resolvedConversationId = body.conversationId?.trim() || randomUUID();

  const wantsStream =
    body.stream ??
    req.headers.get("accept")?.includes("text/event-stream") ??
    false;

  const startedAt = Date.now();
  let startedTurn: StartedTurn | null = null;

  try {
    startedTurn = await startTurn({
      req,
      request: {
        ...body,
        conversationId: resolvedConversationId,
      },
      route: "/api/agent",
      path: req.nextUrl.pathname,
      streamed: wantsStream,
    });
  } catch (error) {
    console.error("Failed to start chat turn log", error);
  }

  if (wantsStream) {
    let streamedText = "";

    const stream = createAgentStream(async function* () {
      let completed = false;

      try {
        const upstream = streamAgent({
          messages: body.messages,
          conversationId: resolvedConversationId,
          location,
        });

        for await (const event of upstream) {
          if (event.type === "delta") {
            streamedText += event.delta;
            yield event;
            continue;
          }

          if (event.type === "final") {
            const finalResponse: AgentResponse = {
              ...event.response,
              conversationId:
                startedTurn?.conversationId ?? resolvedConversationId,
              message: {
                ...event.response.message,
                content: event.response.message.content || streamedText,
              },
            };

            if (startedTurn) {
              await safeCompleteTurn({
                startedTurn,
                response: finalResponse,
                durationMs: Date.now() - startedAt,
                assistantMessage: streamedText || finalResponse.message.content,
              });
              completed = true;
            }

            const finalEvent: AgentStreamEvent = {
              type: "final",
              response: finalResponse,
            };
            yield finalEvent;
            continue;
          }

          yield event;
        }

        if (startedTurn && !completed) {
          const fallbackResponse: AgentResponse = {
            id: randomUUID(),
            conversationId:
              startedTurn?.conversationId ?? resolvedConversationId,
            message: {
              role: "assistant",
              content: streamedText || "I haven't shared that yet.",
            },
          };
          await safeCompleteTurn({
            startedTurn,
            response: fallbackResponse,
            durationMs: Date.now() - startedAt,
            assistantMessage: streamedText,
          });
        }
      } catch (error) {
        if (startedTurn) {
          await safeFailTurn({
            startedTurn,
            error,
            durationMs: Date.now() - startedAt,
            partialAssistantMessage: streamedText,
          });
        }
        throw error;
      }
    });

    const headers = new Headers();
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");

    return new NextResponse(stream, { status: 200, headers });
  }

  try {
    const response = await runAgent({
      messages: body.messages,
      conversationId: resolvedConversationId,
      location,
    });

    const enrichedResponse: AgentResponse = {
      ...response,
      conversationId: startedTurn?.conversationId ?? resolvedConversationId,
    };

    if (startedTurn) {
      await safeCompleteTurn({
        startedTurn,
        response: enrichedResponse,
        durationMs: Date.now() - startedAt,
      });
    }

    return NextResponse.json(enrichedResponse, { status: 200 });
  } catch (err) {
    if (startedTurn) {
      await safeFailTurn({
        startedTurn,
        error: err,
        durationMs: Date.now() - startedAt,
      });
    }

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
