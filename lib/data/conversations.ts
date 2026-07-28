import type { Document, Filter } from "mongodb";

import {
  getChatConversationTurnsCollection,
  type ChatConversationTurnDocument,
} from "@/lib/db/collections";
import type {
  AdminConversationDetailResponse,
  AdminConversationsListResponse,
  AdminConversationTurnsResponse,
  ChatConversationDetail,
  ChatConversationTurnItem,
} from "@/types";

type AggregatedConversation = {
  conversationId: string;
  sessionId?: string;
  location?: string;
  actorType: "public";
  startedAt: Date | string;
  lastMessageAt: Date | string;
  turnCount: number;
  successfulTurns: number;
  failedTurns: number;
  status: "active" | "errored";
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastError?: string;
};

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

const mapConversation = (doc: AggregatedConversation): ChatConversationDetail => {
  return {
    conversationId: doc.conversationId,
    sessionId: doc.sessionId,
    location: doc.location,
    actorType: "public",
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

const buildConversationSummaryPipeline = (input: {
  conversationId?: string;
  sessionId?: string;
  q?: string;
  status?: "active" | "errored";
  start?: Date;
  end?: Date;
}): Document[] => {
  const baseMatch: Document = {};

  if (input.conversationId) {
    baseMatch.conversationId = input.conversationId;
  }
  if (input.sessionId?.trim()) {
    baseMatch.sessionId = input.sessionId.trim();
  }

  const postMatch: Document = {};

  if (input.start || input.end) {
    const range: Document = {};
    if (input.start) range.$gte = input.start;
    if (input.end) range.$lte = input.end;
    postMatch.lastMessageAt = range;
  }

  if (input.status) {
    postMatch.status = input.status;
  }

  if (input.q?.trim()) {
    const pattern = new RegExp(escapeRegex(input.q.trim()), "i");
    postMatch.$or = [
      { lastUserMessage: { $regex: pattern } },
      { lastAssistantMessage: { $regex: pattern } },
      { conversationId: { $regex: pattern } },
      { sessionId: { $regex: pattern } },
    ];
  }

  return [
    ...(Object.keys(baseMatch).length ? [{ $match: baseMatch }] : []),
    { $sort: { conversationId: 1, turnIndex: -1, timestamp: -1 } },
    {
      $group: {
        _id: "$conversationId",
        conversationId: { $first: "$conversationId" },
        sessionId: { $first: "$sessionId" },
        location: { $first: "$location" },
        startedAt: { $min: "$timestamp" },
        lastMessageAt: { $max: "$timestamp" },
        turnCount: { $sum: 1 },
        successfulTurns: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
        failedTurns: {
          $sum: {
            $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
          },
        },
        lastStatus: { $first: "$status" },
        lastUserMessage: { $first: "$request.lastUserMessage" },
        lastAssistantMessage: { $first: "$response.message" },
        lastError: { $first: "$error.message" },
      },
    },
    {
      $project: {
        _id: 0,
        conversationId: 1,
        sessionId: 1,
        location: 1,
        actorType: { $literal: "public" },
        startedAt: 1,
        lastMessageAt: 1,
        turnCount: 1,
        successfulTurns: 1,
        failedTurns: 1,
        status: {
          $cond: [{ $eq: ["$lastStatus", "failed"] }, "errored", "active"],
        },
        lastUserMessage: 1,
        lastAssistantMessage: 1,
        lastError: 1,
      },
    },
    ...(Object.keys(postMatch).length ? [{ $match: postMatch }] : []),
    { $sort: { lastMessageAt: -1 } },
  ];
};

export async function listConversations(input: {
  start?: string;
  end?: string;
  status?: "active" | "errored";
  sessionId?: string;
  q?: string;
  limit?: number;
  skip?: number;
}): Promise<AdminConversationsListResponse> {
  const collection = await getChatConversationTurnsCollection();

  const end = parseDate(input.end, new Date());
  const start = parseDate(
    input.start,
    new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000),
  );

  const limit = clamp(input.limit ?? 50, 1, 200);
  const skip = Math.max(0, input.skip ?? 0);

  const pipeline: Document[] = [
    ...buildConversationSummaryPipeline({
      start,
      end,
      status: input.status,
      sessionId: input.sessionId,
      q: input.q,
    }),
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [aggregated] = await collection
    .aggregate<{
      items: AggregatedConversation[];
      total: Array<{ count: number }>;
    }>(pipeline)
    .toArray();

  const items = aggregated?.items ?? [];
  const total = aggregated?.total?.[0]?.count ?? 0;

  return {
    ok: true,
    total,
    items: items.map(mapConversation),
  };
}

export async function getConversationDetail(
  conversationId: string,
): Promise<AdminConversationDetailResponse> {
  const collection = await getChatConversationTurnsCollection();
  const [item] = await collection
    .aggregate<AggregatedConversation>([
      ...buildConversationSummaryPipeline({
        conversationId,
      }),
      { $limit: 1 },
    ])
    .toArray();

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
  const turns = await getChatConversationTurnsCollection();
  await turns.deleteMany({ conversationId });
}
