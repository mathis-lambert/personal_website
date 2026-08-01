import type {
  Collection,
  Document,
  IndexDescription,
  IndexDescriptionInfo,
  ObjectId,
} from "mongodb";

import type {
  EditorialStatus,
  TimelineEntry,
} from "@/types/content";
import type { ResumeData } from "@/types/resume";
import type { AgentMessage, AgentUsage } from "@/types/agent";
import type { MediaAsset, MediaVariant } from "@/types/media";
import type {
  EditorialCollection,
  EditorialSnapshot,
  NoteSnapshot,
  ProjectSnapshot,
} from "@/types/editorial";

import { getMongoDb } from "./client";

type BaseDocument = Document & {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

type PublicationDocument = {
  editorialStatus?: EditorialStatus;
  draftRevision?: number;
  publishedDraftRevision?: number;
  publishedVersion?: number;
  publishedAt?: Date;
};

export type ProjectDocument = ProjectSnapshot &
  BaseDocument &
  PublicationDocument;

export type NoteDocument = NoteSnapshot &
  BaseDocument &
  PublicationDocument;

export type EditorialContentDocument = ProjectDocument | NoteDocument;

export type ContentPublicationDocument = BaseDocument & {
  contentId: ObjectId;
  collection: EditorialCollection;
  version: number;
  snapshot: EditorialSnapshot;
  sourceDraftRevision: number;
  restoredFromVersion?: number;
  publishedAt: Date;
};

export type TimelineDocument = TimelineEntry &
  BaseDocument & {
    order?: number;
  };

export type ResumeDocument = ResumeData & BaseDocument;

export type MediaAssetDocument = Omit<
  MediaAsset,
  "_id" | "createdAt" | "updatedAt" | "variants"
> &
  BaseDocument & {
    variants: MediaVariant[];
  };

export type ApiRequestLogDocument = BaseDocument & {
  kind: "api_request";
  timestamp: Date;
  route: string;
  path: string;
  method: string;
  status: number;
  ok: boolean;
  durationMs: number;
  query?: Record<string, string | string[]>;
  actor: {
    type: "public" | "admin" | "system";
    hasSession: boolean;
    ipHash?: string;
    userAgent?: string;
  };
  request?: {
    contentType?: string;
    body?: unknown;
    headers?: Record<string, string | string[]>;
  };
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
};

export type UiEventDocument = BaseDocument & {
  kind: "ui_event";
  timestamp: Date;
  name: string;
  path?: string;
  referrer?: string;
  sessionId?: string;
  actor: {
    type: "public" | "admin";
    hasSession: boolean;
    ipHash?: string;
    userAgent?: string;
  };
  properties?: Record<string, unknown>;
};

export type ChatActorDocument = {
  type: "public";
  hasSession: boolean;
  ipHash?: string;
  userAgent?: string;
};

export type ChatConversationTurnDocument = BaseDocument & {
  kind: "chat_turn";
  turnId: string;
  conversationId: string;
  sessionId?: string;
  turnIndex: number;
  timestamp: Date;
  completedAt?: Date;
  status: "pending" | "completed" | "failed";
  streamed: boolean;
  route: string;
  path: string;
  location?: string;
  actor: ChatActorDocument;
  request: {
    messages: AgentMessage[];
    lastUserMessage?: string;
  };
  response?: {
    message: string;
    model?: string;
    usage?: AgentUsage;
  };
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  durationMs?: number;
};

export const COLLECTION_NAMES = {
  projects: "projects",
  notes: "notes",
  experiences: "experiences",
  studies: "studies",
  resume: "resume",
  apiRequestLogs: "api_request_logs",
  uiEvents: "ui_events",
  chatConversationTurns: "chat_conversation_turns",
  mediaAssets: "media_assets",
  contentPublications: "content_publications",
} as const;

let indexesPromise: Promise<void> | null = null;

const getRetentionSeconds = (
  envKey: string,
  defaultDays: number,
): number | null => {
  const raw = process.env[envKey]?.trim();
  if (!raw) return defaultDays * 24 * 60 * 60;

  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }
  return Math.round(days * 24 * 60 * 60);
};

const ensureTtlIndex = async (
  collection: Collection,
  indexName: string,
  field: string,
  expireAfterSeconds: number | null,
) => {
  const indexes = await collection.indexes();
  const existing = indexes.find((idx) => idx.name === indexName);

  if (expireAfterSeconds == null) {
    if (existing) {
      await collection.dropIndex(indexName);
    }
    return;
  }

  if (
    existing &&
    Number(existing.expireAfterSeconds ?? -1) !== expireAfterSeconds
  ) {
    await collection.dropIndex(indexName);
  }

  if (!existing || Number(existing.expireAfterSeconds ?? -1) !== expireAfterSeconds) {
    await collection.createIndex(
      { [field]: 1 },
      {
        name: indexName,
        expireAfterSeconds,
      },
    );
  }
};

const ensureIndexes = async () => {
  if (indexesPromise) return indexesPromise;
  indexesPromise = (async () => {
    const db = await getMongoDb();

    // Drop legacy indexes on `id` now that we rely solely on Mongo's `_id`.
    await Promise.all(
      [
        COLLECTION_NAMES.projects,
        COLLECTION_NAMES.notes,
        COLLECTION_NAMES.experiences,
        COLLECTION_NAMES.studies,
        COLLECTION_NAMES.resume,
      ].map(async (name) => {
        const exists = await db.listCollections({ name }).hasNext();
        if (!exists) return;

        const collection = db.collection(name);
        const indexes: IndexDescriptionInfo[] = await collection.indexes();

        const hasLegacyIdIndex = indexes.find((idx) => idx.name === "id_1");
        if (hasLegacyIdIndex) {
          await collection.dropIndex("id_1");
        }
        const hasEmbeddedPublicationSlugIndex = indexes.find(
          (idx) => idx.name === "published.slug_1",
        );
        if (hasEmbeddedPublicationSlugIndex) {
          await collection.dropIndex("published.slug_1");
        }
      }),
    );

    const specs: Array<[string, IndexDescription[]]> = [
      [
        COLLECTION_NAMES.projects,
        [
          { key: { slug: 1 }, unique: true, sparse: true },
          { key: { date: -1 } },
        ],
      ],
      [
        COLLECTION_NAMES.notes,
        [
          { key: { slug: 1 }, unique: true, sparse: true },
          { key: { date: -1 } },
        ],
      ],
      [COLLECTION_NAMES.experiences, [{ key: { order: 1 } }]],
      [COLLECTION_NAMES.studies, [{ key: { order: 1 } }]],
      [COLLECTION_NAMES.resume, []],
      [
        COLLECTION_NAMES.mediaAssets,
        [
          { key: { createdAt: -1 } },
          { key: { "variants.key": 1 }, unique: true },
        ],
      ],
      [
        COLLECTION_NAMES.contentPublications,
        [
          {
            key: { collection: 1, contentId: 1, version: 1 },
            unique: true,
          },
          { key: { collection: 1, contentId: 1, publishedAt: -1 } },
          { key: { collection: 1, "snapshot.slug": 1 } },
        ],
      ],
      [
        COLLECTION_NAMES.apiRequestLogs,
        [
          { key: { timestamp: -1 } },
          { key: { route: 1, timestamp: -1 } },
          { key: { method: 1, timestamp: -1 } },
          { key: { status: 1, timestamp: -1 } },
          { key: { "actor.type": 1, timestamp: -1 } },
        ],
      ],
      [
        COLLECTION_NAMES.uiEvents,
        [
          { key: { timestamp: -1 } },
          { key: { name: 1, timestamp: -1 } },
          { key: { path: 1, timestamp: -1 } },
          { key: { "actor.type": 1, name: 1, timestamp: -1 } },
          { key: { "actor.type": 1, path: 1, timestamp: -1 } },
          {
            key: {
              "actor.type": 1,
              name: 1,
              "properties.slug": 1,
              timestamp: -1,
            },
            sparse: true,
          },
          { key: { sessionId: 1, timestamp: -1 }, sparse: true },
        ],
      ],
      [
        COLLECTION_NAMES.chatConversationTurns,
        [
          { key: { turnId: 1 }, unique: true },
          { key: { conversationId: 1, turnIndex: 1 }, unique: true },
          { key: { timestamp: -1 } },
          { key: { conversationId: 1, timestamp: -1 } },
          { key: { status: 1, timestamp: -1 } },
          { key: { "actor.ipHash": 1, timestamp: -1 }, sparse: true },
          {
            key: {
              "request.lastUserMessage": "text",
              "response.message": "text",
            },
          },
        ],
      ],
    ];

    await Promise.all(
      specs.map(([name, indexes]) => {
        if (!indexes.length) return Promise.resolve();
        return db.collection(name).createIndexes(indexes);
      }),
    );

    const analyticsRetentionSeconds = getRetentionSeconds(
      "ANALYTICS_LOG_RETENTION_DAYS",
      180,
    );
    const chatRetentionSeconds = getRetentionSeconds(
      "CHAT_LOG_RETENTION_DAYS",
      365,
    );

    await Promise.all([
      ensureTtlIndex(
        db.collection(COLLECTION_NAMES.apiRequestLogs),
        "timestamp_ttl",
        "timestamp",
        analyticsRetentionSeconds,
      ),
      ensureTtlIndex(
        db.collection(COLLECTION_NAMES.uiEvents),
        "timestamp_ttl",
        "timestamp",
        analyticsRetentionSeconds,
      ),
      ensureTtlIndex(
        db.collection(COLLECTION_NAMES.chatConversationTurns),
        "timestamp_ttl",
        "timestamp",
        chatRetentionSeconds,
      ),
    ]);
  })();
  return indexesPromise;
};

const getCollection = async <T extends Document>(
  name: string,
): Promise<Collection<T>> => {
  await ensureIndexes();
  const db = await getMongoDb();
  return db.collection<T>(name);
};

export const getProjectsCollection = () =>
  getCollection<ProjectDocument>(COLLECTION_NAMES.projects);

export const getNotesCollection = () =>
  getCollection<NoteDocument>(COLLECTION_NAMES.notes);

/**
 * Shared access for operations that are identical across editorial content.
 * Mongo's invariant Collection<T> type cannot represent the project/note union,
 * so the single driver boundary cast lives here instead of in domain modules.
 */
export const getEditorialContentCollection = async (
  name: EditorialCollection,
): Promise<Collection<EditorialContentDocument>> =>
  (name === "projects"
    ? await getProjectsCollection()
    : await getNotesCollection()) as unknown as Collection<EditorialContentDocument>;

export const getExperiencesCollection = () =>
  getCollection<TimelineDocument>(COLLECTION_NAMES.experiences);

export const getStudiesCollection = () =>
  getCollection<TimelineDocument>(COLLECTION_NAMES.studies);

export const getResumeCollection = () =>
  getCollection<ResumeDocument>(COLLECTION_NAMES.resume);

export const getApiRequestLogsCollection = () =>
  getCollection<ApiRequestLogDocument>(COLLECTION_NAMES.apiRequestLogs);

export const getUiEventsCollection = () =>
  getCollection<UiEventDocument>(COLLECTION_NAMES.uiEvents);

export const getChatConversationTurnsCollection = () =>
  getCollection<ChatConversationTurnDocument>(
    COLLECTION_NAMES.chatConversationTurns,
  );

export const getMediaAssetsCollection = () =>
  getCollection<MediaAssetDocument>(COLLECTION_NAMES.mediaAssets);

export const getContentPublicationsCollection = () =>
  getCollection<ContentPublicationDocument>(
    COLLECTION_NAMES.contentPublications,
  );
