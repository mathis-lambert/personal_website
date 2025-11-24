import type { Collection, IndexDescription } from "mongodb";

import type { Article, Project, ResumeData, TimelineEntry } from "@/types";

import { getMongoDb } from "./client";

export type ProjectDocument = Project & {
  _id?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ArticleDocument = Article & {
  _id?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TimelineDocument = TimelineEntry & {
  id: string;
  order?: number;
  _id?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ResumeDocument = ResumeData & {
  id: string;
  _id?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export type EventDocument = {
  _id?: unknown;
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

export const DEFAULT_RESUME_ID = "primary";

let indexesPromise: Promise<void> | null = null;

const ensureIndexes = async () => {
  if (indexesPromise) return indexesPromise;
  indexesPromise = (async () => {
    const db = await getMongoDb();
    const specs: Array<[string, IndexDescription[]]> = [
      [
        COLLECTION_NAMES.projects,
        [
          { key: { id: 1 }, unique: true },
          { key: { slug: 1 }, unique: true, sparse: true },
          { key: { date: -1 } },
        ],
      ],
      [
        COLLECTION_NAMES.articles,
        [
          { key: { id: 1 }, unique: true },
          { key: { slug: 1 }, unique: true, sparse: true },
          { key: { date: -1 } },
        ],
      ],
      [
        COLLECTION_NAMES.experiences,
        [{ key: { id: 1 }, unique: true }, { key: { order: 1 } }],
      ],
      [
        COLLECTION_NAMES.studies,
        [{ key: { id: 1 }, unique: true }, { key: { order: 1 } }],
      ],
      [COLLECTION_NAMES.resume, [{ key: { id: 1 }, unique: true }]],
      [
        COLLECTION_NAMES.events,
        [{ key: { created_at: -1 } }, { key: { action: 1, created_at: -1 } }],
      ],
    ];

    await Promise.all(
      specs.map(([name, indexes]) =>
        db.collection(name).createIndexes(indexes),
      ),
    );
  })();
  return indexesPromise;
};

const getCollection = async <T>(name: string): Promise<Collection<T>> => {
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
