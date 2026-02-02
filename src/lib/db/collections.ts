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

export type EventDocument = BaseDocument & {
  job_id?: string;
  action?: string;
  request_body?: Record<string, unknown>;
  created_at: Date;
};

export const COLLECTION_NAMES = {
  projects: "projects",
  articles: "articles",
  experiences: "experiences",
  studies: "studies",
  resume: "resume",
  events: "events",
} as const;

let indexesPromise: Promise<void> | null = null;

const ensureIndexes = async () => {
  if (indexesPromise) return indexesPromise;
  indexesPromise = (async () => {
    const db = await getMongoDb();

    // Drop legacy indexes on `id` now that we rely solely on Mongo's `_id`.
    // This prevents IndexKeySpecsConflict and cleans up old unique constraints.
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
        COLLECTION_NAMES.events,
        [{ key: { created_at: -1 } }, { key: { action: 1, created_at: -1 } }],
      ],
    ];

    await Promise.all(
      specs.map(([name, indexes]) => {
        if (!indexes.length) return Promise.resolve();
        return db.collection(name).createIndexes(indexes);
      }),
    );
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

export const getEventsCollection = () =>
  getCollection<EventDocument>(COLLECTION_NAMES.events);
