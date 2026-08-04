import type { MetadataRoute } from "next";

import { getAllNotes, getAllProjects } from "@/lib/data/content";
import { SITE_URL } from "@/lib/site";

/** Read per request, like the pages: publishing has to show up without a rebuild. */
export const dynamic = "force-dynamic";

type Dated = {
  _id: string;
  slug?: string;
  date: string;
  publishedAt?: string;
  updatedAt?: string;
};

/** The most recent valid date among those given, or nothing if none parse. */
const newest = (...values: (string | undefined)[]): Date | undefined => {
  const times = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => !Number.isNaN(time));
  return times.length ? new Date(Math.max(...times)) : undefined;
};

const touched = (item: Dated) => newest(item.publishedAt, item.updatedAt, item.date);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Both accessors return published items only, which is exactly what belongs here.
  const [projects, notes] = await Promise.all([getAllProjects(), getAllNotes()]);

  const listing = (kind: "projects" | "notes", items: Dated[]): MetadataRoute.Sitemap =>
    items.map((item) => ({
      url: `${SITE_URL}/${kind}/${item.slug || item._id}`,
      lastModified: touched(item),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/projects`,
      lastModified: newest(...projects.map((project) => touched(project)?.toISOString())),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/notes`,
      lastModified: newest(...notes.map((note) => touched(note)?.toISOString())),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${SITE_URL}/resume`, changeFrequency: "monthly", priority: 0.7 },
    ...listing("projects", projects),
    ...listing("notes", notes),
  ];
}
