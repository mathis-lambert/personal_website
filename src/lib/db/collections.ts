import type {
  Collection,
  Document,
  IndexDescription,
  IndexDescriptionInfo,
  ObjectId,
} from "mongodb";

import type { Article, Project, ResumeData, TimelineEntry } from "@/types";

import { getMongoDb } from "./client";

type BaseDocument = Document & {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProjectDocument = Omit<Project, "_id"> & BaseDocument;

export type ArticleDocument = Omit<Article, "_id"> & BaseDocument;

export type TimelineDocument = TimelineEntry &
  BaseDocument & {
    order?: number;
  };

export type ResumeDocument = ResumeData & BaseDocument;

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

export const COLLECTION_NAMES = {
  projects: "projects",
  articles: "articles",
  experiences: "experiences",
  studies: "studies",
  resume: "resume",
  apiRequestLogs: "api_request_logs",
  uiEvents: "ui_events",
} as const;

let indexesPromise: Promise<void> | null = null;

const getRetentionSeconds = (): number | null => {
  const raw = process.env.ANALYTICS_LOG_RETENTION_DAYS?.trim();
  if (!raw) return 180 * 24 * 60 * 60;

  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }
  return Math.round(days * 24 * 60 * 60);
};

const ensureTtlIndex = async (
  collection: Collection,
  indexName: string,
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
      { timestamp: 1 },
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
        COLLECTION_NAMES.articles,
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
        COLLECTION_NAMES.articles,
        [
          { key: { slug: 1 }, unique: true, sparse: true },
          { key: { date: -1 } },
        ],
      ],
      [COLLECTION_NAMES.experiences, [{ key: { order: 1 } }]],
      [COLLECTION_NAMES.studies, [{ key: { order: 1 } }]],
      [COLLECTION_NAMES.resume, []],
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
          { key: { sessionId: 1, timestamp: -1 }, sparse: true },
        ],
      ],
    ];

    await Promise.all(
      specs.map(([name, indexes]) => {
        if (!indexes.length) return Promise.resolve();
        return db.collection(name).createIndexes(indexes);
      }),
    );

    const retentionSeconds = getRetentionSeconds();
    await Promise.all([
      ensureTtlIndex(
        db.collection(COLLECTION_NAMES.apiRequestLogs),
        "timestamp_ttl",
        retentionSeconds,
      ),
      ensureTtlIndex(
        db.collection(COLLECTION_NAMES.uiEvents),
        "timestamp_ttl",
        retentionSeconds,
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

export const getArticlesCollection = () =>
  getCollection<ArticleDocument>(COLLECTION_NAMES.articles);

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
