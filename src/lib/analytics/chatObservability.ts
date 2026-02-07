import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  getChatConversationTurnsCollection,
  type ChatActorDocument,
} from "@/lib/db/collections";
import { buildActorContext } from "@/lib/analytics/context";
import { redactFreeText } from "@/lib/analytics/redaction";
import type { AgentMessage, AgentRequest, AgentResponse } from "@/types/agent";

export type StartedTurn = {
  turnId: string;
  conversationId: string;
  turnIndex: number;
  startedAt: Date;
  sessionId?: string;
};

const toPublicActor = (req: NextRequest): ChatActorDocument => {
  const context = buildActorContext(req, "public");
  return {
    type: "public",
    hasSession: context.hasSession,
    ipHash: context.ipHash,
    userAgent: context.userAgent,
  };
};

const normalizeError = (error: unknown): {
  name?: string;
  message: string;
  stack?: string;
} => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactFreeText(error.message || "Unknown error"),
      stack: error.stack,
    };
  }

  return {
    message: redactFreeText(typeof error === "string" ? error : "Unknown error"),
  };
};

const sanitizeMessage = (message: AgentMessage): AgentMessage => {
  return {
    role: message.role,
    content: redactFreeText(message.content ?? ""),
    name: message.name,
  };
};

const getLastUserMessage = (messages: AgentMessage[]): string | undefined => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "user") {
      return message.content;
    }
  }
  return undefined;
};

const buildResponsePayload = (input: {
  message?: string;
  model?: string;
  usage?: AgentResponse["usage"];
}): {
  message: string;
  model?: string;
  usage?: AgentResponse["usage"];
} | null => {
  if (typeof input.message !== "string") return null;
  const message = redactFreeText(input.message);
  if (!message.length) return null;
  return {
    message,
    model: input.model,
    usage: input.usage,
  };
};

const finalizeTurn = async (input: {
  turnId: string;
  status: "completed" | "failed";
  durationMs: number;
  response?: {
    message?: string;
    model?: string;
    usage?: AgentResponse["usage"];
  };
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}): Promise<void> => {
  const turnsCollection = await getChatConversationTurnsCollection();
  const completedAt = new Date();
  const response = input.response ? buildResponsePayload(input.response) : null;

  await turnsCollection.updateOne(
    { turnId: input.turnId },
    {
      $set: {
        status: input.status,
        completedAt,
        durationMs: input.durationMs,
        ...(response
          ? {
              response,
            }
          : {}),
        ...(input.error
          ? {
              error: input.error,
            }
          : {}),
      },
    },
  );
};

export async function startTurn(input: {
  req: NextRequest;
  request: AgentRequest;
  route: string;
  path: string;
  streamed: boolean;
}): Promise<StartedTurn> {
  const turnsCollection = await getChatConversationTurnsCollection();

  const actor = toPublicActor(input.req);
  const timestamp = new Date();
  const sessionId = input.request.sessionId?.trim() || undefined;
  const conversationId = input.request.conversationId?.trim() || randomUUID();

  const sanitizedMessages = input.request.messages.map(sanitizeMessage);
  const lastUserMessage = getLastUserMessage(sanitizedMessages);

  const lastTurn = await turnsCollection.findOne(
    { conversationId },
    {
      projection: { turnIndex: 1 },
      sort: { turnIndex: -1 },
    },
  );

  const turnIndex = (lastTurn?.turnIndex ?? -1) + 1;
  const turnId = randomUUID();

  await turnsCollection.insertOne({
    kind: "chat_turn",
    turnId,
    conversationId,
    sessionId,
    turnIndex,
    timestamp,
    status: "pending",
    streamed: input.streamed,
    route: input.route,
    path: input.path,
    location: input.request.location,
    actor,
    request: {
      messages: sanitizedMessages,
      lastUserMessage,
    },
  });

  return {
    turnId,
    conversationId,
    turnIndex,
    startedAt: timestamp,
    sessionId,
  };
}

export async function completeTurn(input: {
  turnId: string;
  response: AgentResponse;
  durationMs: number;
  assistantMessage?: string;
}): Promise<void> {
  await finalizeTurn({
    turnId: input.turnId,
    status: "completed",
    durationMs: input.durationMs,
    response: {
      message: input.assistantMessage ?? input.response.message?.content ?? "",
      model: input.response.model,
      usage: input.response.usage,
    },
  });
}

export async function failTurn(input: {
  turnId: string;
  error: unknown;
  durationMs: number;
  partialAssistantMessage?: string;
}): Promise<void> {
  const normalizedError = normalizeError(input.error);

  await finalizeTurn({
    turnId: input.turnId,
    status: "failed",
    durationMs: input.durationMs,
    response: {
      message: input.partialAssistantMessage,
    },
    error: normalizedError,
  });
}
