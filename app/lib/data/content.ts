import { promises as fs } from "fs";
import path from "path";

import type {
  AdminCollectionName,
  AdminListCollectionName,
  Article,
  ArticleMetrics,
  Project,
  ResumeData,
  TimelineEntry,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "app", "data");

const COLLECTION_FILES: Record<
  AdminCollectionName | "events",
  string
> = {
  projects: "projects.json",
  articles: "articles.json",
  experiences: "experiences.json",
  studies: "studies.json",
  resume: "resume.json",
  events: "events.json",
};

type CollectionData<T> = T extends "resume"
  ? ResumeData | null
  : T extends "projects"
  ? Project[]
  : T extends "articles"
  ? Article[]
  : TimelineEntry[];

const ensureDataDir = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      await ensureDataDir();
      await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf-8");
      return fallback;
    }
    throw err;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export const listCollections = (): AdminCollectionName[] => [
  "projects",
  "articles",
  "experiences",
  "studies",
  "resume",
];

function getFilePath(name: keyof typeof COLLECTION_FILES): string {
  return path.join(DATA_DIR, COLLECTION_FILES[name]);
}

export async function getCollection<T extends AdminCollectionName>(
  name: T,
): Promise<CollectionData<T>> {
  const file = getFilePath(name);
  const fallback = name === "resume" ? null : [];
  return (await readJson(file, fallback)) as CollectionData<T>;
}

export async function replaceCollection(
  name: AdminCollectionName,
  payload: unknown,
): Promise<void> {
  if (name === "resume") {
    if (payload && typeof payload === "object") {
      await writeJson(getFilePath("resume"), payload);
      return;
    }
    throw new Error("Payload for resume must be an object");
  }

  if (Array.isArray(payload)) {
    await writeJson(getFilePath(name), payload);
    return;
  }
  throw new Error("Payload must be an array for this collection");
}

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "item";
};

const parseIndex = (itemId: string): number | null => {
  try {
    if (itemId.startsWith("index-")) return parseInt(itemId.split("-")[1]!, 10);
    const parsed = parseInt(itemId, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const ensureUniqueField = (
  items: Array<{ [k: string]: any }>,
  key: "slug" | "id",
  base: string,
  excludeIndex?: number,
) => {
  let candidate = base;
  let suffix = 2;
  const isTaken = (value: string) =>
    items.some((it, idx) => idx !== excludeIndex && it[key] === value);
  while (isTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export async function createProjectOrArticle(
  collection: Extract<AdminCollectionName, "projects" | "articles">,
  item: Record<string, any>,
): Promise<{ id: string; item: Project | Article }> {
  const existing =
    ((await getCollection(collection)) as Array<Record<string, any>>) || [];

  const baseId = item.id || slugify(item.title || collection.slice(0, -1));
  const id = ensureUniqueField(existing, "id", String(baseId));
  const slug = ensureUniqueField(
    existing,
    "slug",
    slugify(item.slug || item.title || baseId),
  );

  const merged = {
    ...item,
    id,
    slug,
  };

  const updated = [...existing, merged];
  await writeJson(getFilePath(collection), updated);
  return { id, item: merged as Project | Article };
}

export async function updateItem(
  collection: AdminCollectionName,
  itemId: string,
  patch: Record<string, any>,
): Promise<Record<string, any>> {
  if (collection === "resume") {
    const current = ((await getCollection("resume")) || {}) as Record<
      string,
      any
    >;
    const updated = { ...current, ...patch };
    await writeJson(getFilePath("resume"), updated);
    return updated;
  }

  const data = ((await getCollection(collection)) ||
    []) as Array<Record<string, any>>;

  const idx = parseIndex(itemId) ?? data.findIndex((it) => it.id === itemId);
  if (idx < 0 || idx >= data.length) {
    throw new Error("Item not found");
  }

  const current = data[idx]!;
  const updated = { ...current, ...patch };

  if (collection === "projects" || collection === "articles") {
    if (patch.slug) {
      updated.slug = ensureUniqueField(
        data,
        "slug",
        slugify(String(patch.slug)),
        idx,
      );
    }
    if (patch.id) {
      updated.id = ensureUniqueField(
        data,
        "id",
        String(patch.id),
        idx,
      );
    }
  }

  data[idx] = updated;
  await writeJson(getFilePath(collection), data);
  return updated;
}

export async function deleteItem(
  collection: AdminListCollectionName,
  itemId: string,
): Promise<Record<string, any>> {
  const data = ((await getCollection(collection)) ||
    []) as Array<Record<string, any>>;
  const idx = parseIndex(itemId) ?? data.findIndex((it) => it.id === itemId);
  if (idx < 0 || idx >= data.length) {
    throw new Error("Item not found");
  }
  const removed = data[idx];
  data.splice(idx, 1);
  await writeJson(getFilePath(collection), data);
  return removed;
}

export async function getAllProjects(): Promise<Project[]> {
  const projects = (await getCollection("projects")) as Project[];
  return projects ?? [];
}

export async function getProjectBySlug(
  slug: string,
): Promise<Project | null> {
  const projects = (await getCollection("projects")) as Project[];
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getAllArticles(): Promise<Article[]> {
  const articles = (await getCollection("articles")) as Article[];
  return articles ?? [];
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const articles = (await getCollection("articles")) as Article[];
  return articles.find((a) => a.slug === slug) ?? null;
}

export async function updateArticleMetric(
  eventType: "like" | "share" | "read",
  payload: { id?: string; slug?: string },
): Promise<ArticleMetrics | null> {
  const articles = (await getCollection("articles")) as Article[];
  const idx = articles.findIndex(
    (a) => (payload.id && a.id === payload.id) || (payload.slug && a.slug === payload.slug),
  );
  if (idx < 0) return null;

  const metrics = articles[idx].metrics || {};
  const key =
    eventType === "like"
      ? "likes"
      : eventType === "share"
        ? "shares"
        : "views";
  const nextMetrics: ArticleMetrics = {
    views: metrics.views ?? 0,
    likes: metrics.likes ?? 0,
    shares: metrics.shares ?? 0,
  };
  nextMetrics[key] = (nextMetrics[key] ?? 0) + 1;

  articles[idx] = { ...articles[idx], metrics: nextMetrics };
  await writeJson(getFilePath("articles"), articles);
  return nextMetrics;
}

export async function getArticleMetrics(
  payload: { id?: string; slug?: string },
): Promise<ArticleMetrics | null> {
  const articles = (await getCollection("articles")) as Article[];
  const found = articles.find(
    (a) => (payload.id && a.id === payload.id) || (payload.slug && a.slug === payload.slug),
  );
  if (!found) return null;
  const metrics = found.metrics || {};
  return {
    views: metrics.views ?? 0,
    likes: metrics.likes ?? 0,
    shares: metrics.shares ?? 0,
  };
}

export async function getExperiences(): Promise<TimelineEntry[]> {
  const experiences = (await getCollection("experiences")) as TimelineEntry[];
  return experiences ?? [];
}

export async function getStudies(): Promise<TimelineEntry[]> {
  const studies = (await getCollection("studies")) as TimelineEntry[];
  return studies ?? [];
}

export async function getResume(): Promise<ResumeData | null> {
  return (await getCollection("resume")) as ResumeData | null;
}

export async function upsertResume(
  patch: Partial<ResumeData>,
): Promise<ResumeData> {
  const current = ((await getCollection("resume")) || {}) as ResumeData;
  const updated = { ...current, ...patch } as ResumeData;
  await writeJson(getFilePath("resume"), updated);
  return updated;
}

export async function replaceResume(data: ResumeData): Promise<void> {
  await writeJson(getFilePath("resume"), data);
}

export async function getEvents(): Promise<Record<string, any>[]> {
  return (await readJson(getFilePath("events"), [])) as Record<string, any>[];
}

export async function appendEvent(event: Record<string, any>): Promise<void> {
  const events = (await getEvents()) ?? [];
  events.push(event);
  await writeJson(getFilePath("events"), events);
}

// Re-export types for downstream API routes
export type { AdminCollectionName, AdminListCollectionName } from "@/types";
