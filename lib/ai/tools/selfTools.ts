import "server-only";
import { z } from "zod";
import { tool } from "langchain";
import { ObjectId } from "mongodb";

import { searchVectorStore } from "@/lib/ai/client";
import { safeJsonStringify, toJsonable } from "@/lib/ai/json";
import {
  getNotesCollection,
  getExperiencesCollection,
  getProjectsCollection,
  getResumeCollection,
  getStudiesCollection,
} from "@/lib/db/collections";

const parseObjectId = (value: string): ObjectId | null => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const createTool = <TInput extends z.ZodTypeAny>(config: {
  name: string;
  description: string;
  schema: TInput;
  handler: (input: z.infer<TInput>) => Promise<unknown>;
}) => {
  return tool(
    async (input: z.infer<TInput>) =>
      safeJsonStringify(await config.handler(input)),
    {
      name: config.name,
      description: config.description,
      schema: config.schema,
    },
  );
};

export const buildSelfTools = () => {
  const getSelfInfo = createTool({
    name: "get_self_info",
    description:
      "Searches Mathis bio vector store for short factual answers about Mathis.",
    schema: z.object({ query: z.string().min(1) }).strict(),
    handler: async ({ query }) => {
      const result = await searchVectorStore({ query, limit: 5 });
      return toJsonable(result);
    },
  });

  const getSelfProjects = createTool({
    name: "get_self_projects",
    description: "Returns a lightweight list of Mathis projects.",
    schema: z.object({}).strict(),
    handler: async () => {
      const collection = await getProjectsCollection();
      const docs = await collection
        .find(
          {},
          {
            projection: {
              _id: 0,
              title: 1,
              slug: 1,
              subtitle: 1,
              technologies: 1,
              categories: 1,
              links: 1,
              date: 1,
              ai_context: 1,
            },
          },
        )
        .sort({ date: -1, title: 1 })
        .toArray();
      return toJsonable(docs);
    },
  });

  const getSelfProjectsBySlug = createTool({
    name: "get_self_projects_by_slug",
    description: "Fetches details for a specific project by slug.",
    schema: z.object({ slug: z.string().min(1) }).strict(),
    handler: async ({ slug }) => {
      const collection = await getProjectsCollection();
      const objectId = parseObjectId(slug);
      const doc = await collection.findOne(
        objectId ? { $or: [{ slug }, { _id: objectId }] } : { slug },
        {
          projection: {
            _id: 0,
            title: 1,
            slug: 1,
            subtitle: 1,
            description: 1,
            content: 1,
            links: 1,
            date: 1,
            technologies: 1,
            categories: 1,
            highlights: 1,
            role: 1,
            client: 1,
            teamSize: 1,
            ai_context: 1,
          },
        },
      );

      if (!doc) {
        return {
          error:
            "Wrong slug, you might have mistyped it. Please use get_self_projects to get the list of all projects.",
        };
      }

      return toJsonable(doc);
    },
  });

  const getSelfNotes = createTool({
    name: "get_self_notes",
    description: "Returns a lightweight list of Mathis notes.",
    schema: z.object({}).strict(),
    handler: async () => {
      const collection = await getNotesCollection();
      const docs = await collection
        .find(
          {},
          {
            projection: {
              _id: 0,
              title: 1,
              slug: 1,
              excerpt: 1,
              tags: 1,
              links: 1,
              date: 1,
              author: 1,
              ai_context: 1,
            },
          },
        )
        .sort({ date: -1, title: 1 })
        .toArray();
      return toJsonable(docs);
    },
  });

  const getSelfNotesBySlug = createTool({
    name: "get_self_notes_by_slug",
    description: "Fetches details for a specific note by slug.",
    schema: z.object({ slug: z.string().min(1) }).strict(),
    handler: async ({ slug }) => {
      const collection = await getNotesCollection();
      const objectId = parseObjectId(slug);
      const doc = await collection.findOne(
        objectId ? { $or: [{ slug }, { _id: objectId }] } : { slug },
        {
          projection: {
            _id: 0,
            title: 1,
            slug: 1,
            excerpt: 1,
            content: 1,
            tags: 1,
            links: 1,
            date: 1,
            author: 1,
            ai_context: 1,
          },
        },
      );

      if (!doc) {
        return {
          error:
            "Wrong slug, you might have mistyped it. Please use get_self_notes to get the list of all notes.",
        };
      }

      return toJsonable(doc);
    },
  });

  const getSelfExperiences = createTool({
    name: "get_self_experiences",
    description: "Returns Mathis experiences and studies timelines.",
    schema: z.object({}).strict(),
    handler: async () => {
      const [experiences, studies] = await Promise.all([
        getExperiencesCollection().then((collection) =>
          collection
            .find({ hide: { $ne: true } }, { projection: { _id: 0 } })
            .sort({ order: 1, date: -1, _id: 1 })
            .toArray(),
        ),
        getStudiesCollection().then((collection) =>
          collection
            .find({ hide: { $ne: true } }, { projection: { _id: 0 } })
            .sort({ order: 1, date: -1, _id: 1 })
            .toArray(),
        ),
      ]);

      return toJsonable({ experiences, studies });
    },
  });

  const getSelfCertifications = createTool({
    name: "get_self_certifications",
    description: "Returns Mathis certifications from the resume.",
    schema: z.object({}).strict(),
    handler: async () => {
      const collection = await getResumeCollection();
      const doc = await collection.findOne(
        {},
        { projection: { _id: 0, certifications: 1 } },
      );
      return toJsonable(doc ?? { certifications: [] });
    },
  });

  const getSelfResume = createTool({
    name: "get_self_resume",
    description: "Returns the full resume payload for Mathis.",
    schema: z.object({}).strict(),
    handler: async () => {
      const collection = await getResumeCollection();
      const doc = await collection.findOne({}, { projection: { _id: 0 } });
      return toJsonable(doc ?? {});
    },
  });

  return [
    getSelfInfo,
    getSelfProjects,
    getSelfProjectsBySlug,
    getSelfNotes,
    getSelfNotesBySlug,
    getSelfExperiences,
    getSelfCertifications,
    getSelfResume,
  ];
};
