import type { Filter } from "mongodb";

import {
  getChatConversationTurnsCollection,
  getChatConversationsCollection,
  type ChatConversationDocument,
  type ChatConversationTurnDocument,
} from "@/lib/db/collections";
import type {
  AdminConversationDetailResponse,
  AdminConversationsListResponse,
  AdminConversationTurnsResponse,
  ChatConversationDetail,
  ChatConversationTurnItem,
} from "@/types";

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const parseDate = (value?: string, fallback?: Date): Date => {
  if (!value) return fallback ?? new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback ?? new Date();
  }
  return parsed;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const toIso = (value: Date | string | undefined): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const mapConversation = (
  doc: ChatConversationDocument,
): ChatConversationDetail => {
  return {
    conversationId: doc.conversationId,
    sessionId: doc.sessionId,
    location: doc.location,
    actorType: doc.actor.type,
    startedAt: toIso(doc.startedAt),
    lastMessageAt: toIso(doc.lastMessageAt),
    turnCount: doc.turnCount,
    successfulTurns: doc.successfulTurns,
    failedTurns: doc.failedTurns,
    status: doc.status,
    lastUserMessage: doc.lastUserMessage,
    lastAssistantMessage: doc.lastAssistantMessage,
    lastError: doc.lastError,
  };
};

const mapTurn = (doc: ChatConversationTurnDocument): ChatConversationTurnItem => {
  return {
    turnId: doc.turnId,
    conversationId: doc.conversationId,
    turnIndex: doc.turnIndex,
    status: doc.status,
    streamed: doc.streamed,
    createdAt: toIso(doc.timestamp),
    completedAt: doc.completedAt ? toIso(doc.completedAt) : undefined,
    durationMs: doc.durationMs,
    route: doc.route,
    path: doc.path,
    location: doc.location,
    requestMessages: doc.request.messages,
    lastUserMessage: doc.request.lastUserMessage,
    assistantMessage: doc.response?.message,
    model: doc.response?.model,
    usage: doc.response?.usage,
    errorMessage: doc.error?.message,
  };
};

export async function listConversations(input: {
  start?: string;
  end?: string;
  actorType?: "public" | "admin";
  status?: "active" | "errored";
  sessionId?: string;
  q?: string;
  limit?: number;
  skip?: number;
}): Promise<AdminConversationsListResponse> {
  const collection = await getChatConversationsCollection();

  const end = parseDate(input.end, new Date());
  const start = parseDate(
    input.start,
    new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000),
  );

  const filter: Filter<ChatConversationDocument> = {
    lastMessageAt: { $gte: start, $lte: end },
  };

  if (input.actorType) {
    filter["actor.type"] = input.actorType;
  }
  if (input.status) {
    filter.status = input.status;
  }
  if (input.sessionId?.trim()) {
    filter.sessionId = input.sessionId.trim();
  }
  if (input.q?.trim()) {
    const pattern = new RegExp(escapeRegex(input.q.trim()), "i");
    filter.$or = [
      { lastUserMessage: { $regex: pattern } },
      { lastAssistantMessage: { $regex: pattern } },
      { conversationId: { $regex: pattern } },
      { sessionId: { $regex: pattern } },
    ];
  }

  const limit = clamp(input.limit ?? 50, 1, 200);
  const skip = Math.max(0, input.skip ?? 0);

  const [items, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    ok: true,
    total,
    items: items.map(mapConversation),
  };
}

export async function getConversationDetail(
  conversationId: string,
): Promise<AdminConversationDetailResponse> {
  const collection = await getChatConversationsCollection();
  const item = await collection.findOne({ conversationId });
  return {
    ok: true,
    item: item ? mapConversation(item) : null,
  };
}

export async function listConversationTurns(input: {
  conversationId: string;
  q?: string;
  limit?: number;
  skip?: number;
}): Promise<AdminConversationTurnsResponse> {
  const collection = await getChatConversationTurnsCollection();

  const filter: Filter<ChatConversationTurnDocument> = {
    conversationId: input.conversationId,
  };

  if (input.q?.trim()) {
    const pattern = new RegExp(escapeRegex(input.q.trim()), "i");
    filter.$or = [
      { "request.lastUserMessage": { $regex: pattern } },
      { "response.message": { $regex: pattern } },
      { turnId: { $regex: pattern } },
    ];
  }

  const limit = clamp(input.limit ?? 100, 1, 300);
  const skip = Math.max(0, input.skip ?? 0);

  const [items, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ turnIndex: 1, timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    ok: true,
    total,
    items: items.map(mapTurn),
  };
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const [conversations, turns] = await Promise.all([
    getChatConversationsCollection(),
    getChatConversationTurnsCollection(),
  ]);

  await Promise.all([
    conversations.deleteOne({ conversationId }),
    turns.deleteMany({ conversationId }),
  ]);
}
