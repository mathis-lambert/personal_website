import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  getChatConversationTurnsCollection,
  getChatConversationsCollection,
  type ChatActorDocument,
  type ChatConversationDocument,
} from "@/lib/db/collections";
import { buildActorContext } from "@/lib/analytics/context";
import { redactFreeText } from "@/lib/analytics/redaction";
import type { AgentMessage, AgentRequest, AgentResponse } from "@/types/agent";

type ConversationCounterIncrements = Partial<{
  turnCount: number;
  successfulTurns: number;
  failedTurns: number;
  totalInputChars: number;
  totalOutputChars: number;
  totalDurationMs: number;
}>;

type SummaryPatch = {
  conversationId: string;
  timestamp: Date;
  actor: ChatActorDocument;
  sessionId?: string;
  location?: string;
  status?: ChatConversationDocument["status"];
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastError?: string;
  increments?: ConversationCounterIncrements;
};

export type StartedTurn = {
  turnId: string;
  conversationId: string;
  turnIndex: number;
  startedAt: Date;
  sessionId?: string;
};

const toPublicOrAdminActor = (req: NextRequest): ChatActorDocument => {
  const actor = buildActorContext(req, "public");
  return {
    ...actor,
    type: actor.type === "admin" ? "admin" : "public",
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

const totalChars = (messages: AgentMessage[]): number => {
  return messages.reduce((acc, message) => acc + message.content.length, 0);
};

export async function upsertConversationSummary(patch: SummaryPatch) {
  const collection = await getChatConversationsCollection();

  const setValues: Partial<ChatConversationDocument> = {
    lastMessageAt: patch.timestamp,
    location: patch.location,
    sessionId: patch.sessionId,
    actor: patch.actor,
    status: patch.status,
    lastUserMessage: patch.lastUserMessage,
    lastAssistantMessage: patch.lastAssistantMessage,
    lastError: patch.lastError,
  };

  const cleanSetValues = Object.fromEntries(
    Object.entries(setValues).filter(([, value]) => value !== undefined),
  );

  const increments = Object.fromEntries(
    Object.entries(patch.increments ?? {}).filter(([, value]) => value),
  );

  await collection.updateOne(
    { conversationId: patch.conversationId },
    {
      $setOnInsert: {
        kind: "chat_conversation",
        conversationId: patch.conversationId,
        startedAt: patch.timestamp,
        lastMessageAt: patch.timestamp,
        turnCount: 0,
        successfulTurns: 0,
        failedTurns: 0,
        totalInputChars: 0,
        totalOutputChars: 0,
        totalDurationMs: 0,
        status: "active",
        actor: patch.actor,
      },
      $set: cleanSetValues,
      ...(Object.keys(increments).length ? { $inc: increments } : {}),
    },
    { upsert: true },
  );
}

export async function startTurn(input: {
  req: NextRequest;
  request: AgentRequest;
  route: string;
  path: string;
  streamed: boolean;
}): Promise<StartedTurn> {
  const turnsCollection = await getChatConversationTurnsCollection();

  const actor = toPublicOrAdminActor(input.req);
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

  await upsertConversationSummary({
    conversationId,
    timestamp,
    actor,
    sessionId,
    location: input.request.location,
    status: "active",
    lastUserMessage,
    increments: {
      turnCount: 1,
      totalInputChars: totalChars(sanitizedMessages),
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
  conversationId: string;
  response: AgentResponse;
  durationMs: number;
  assistantMessage?: string;
}): Promise<void> {
  const turnsCollection = await getChatConversationTurnsCollection();
  const conversationsCollection = await getChatConversationsCollection();
  const completedAt = new Date();

  const assistantMessage = redactFreeText(
    input.assistantMessage ?? input.response.message?.content ?? "",
  );

  const turn = await turnsCollection.findOne({ turnId: input.turnId });
  if (!turn) return;

  await turnsCollection.updateOne(
    { turnId: input.turnId },
    {
      $set: {
        status: "completed",
        completedAt,
        durationMs: input.durationMs,
        response: {
          message: assistantMessage,
          model: input.response.model,
          usage: input.response.usage,
        },
      },
    },
  );

  const outputChars = assistantMessage.length;

  await upsertConversationSummary({
    conversationId: input.conversationId,
    timestamp: completedAt,
    actor: turn.actor,
    sessionId: turn.sessionId,
    location: turn.location,
    status: "active",
    lastUserMessage: turn.request?.lastUserMessage,
    lastAssistantMessage: assistantMessage,
    lastError: undefined,
    increments: {
      successfulTurns: 1,
      totalOutputChars: outputChars,
      totalDurationMs: input.durationMs,
    },
  });

  await conversationsCollection.updateOne(
    { conversationId: input.conversationId },
    { $unset: { lastError: "" } },
  );
}

export async function failTurn(input: {
  turnId: string;
  conversationId: string;
  error: unknown;
  durationMs: number;
  partialAssistantMessage?: string;
}): Promise<void> {
  const turnsCollection = await getChatConversationTurnsCollection();
  const completedAt = new Date();
  const normalizedError = normalizeError(input.error);
  const partialAssistantMessage = input.partialAssistantMessage
    ? redactFreeText(input.partialAssistantMessage)
    : undefined;

  const turn = await turnsCollection.findOne({ turnId: input.turnId });
  if (!turn) return;

  await turnsCollection.updateOne(
    { turnId: input.turnId },
    {
      $set: {
        status: "failed",
        completedAt,
        durationMs: input.durationMs,
        error: normalizedError,
        ...(partialAssistantMessage
          ? {
              response: {
                message: partialAssistantMessage,
              },
            }
          : {}),
      },
    },
  );

  await upsertConversationSummary({
    conversationId: input.conversationId,
    timestamp: completedAt,
    actor: turn.actor,
    sessionId: turn.sessionId,
    location: turn.location,
    status: "errored",
    lastUserMessage: turn.request?.lastUserMessage,
    lastAssistantMessage: partialAssistantMessage,
    lastError: normalizedError.message,
    increments: {
      failedTurns: 1,
      totalOutputChars: partialAssistantMessage?.length ?? 0,
      totalDurationMs: input.durationMs,
    },
  });
}
