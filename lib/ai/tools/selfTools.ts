import "server-only";
import { z } from "zod";
import { tool } from "langchain";

import { searchVectorStore } from "@/lib/ai/client";
import { safeJsonStringify, toJsonable } from "@/lib/ai/json";
import {
  getExperiencesCollection,
  getResumeCollection,
  getStudiesCollection,
} from "@/lib/db/collections";
import {
  getAllNotes,
  getAllProjects,
  getNoteBySlug,
  getProjectBySlug,
} from "@/lib/data/content";

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
      const projects = await getAllProjects();
      return toJsonable(
        projects.map(
          ({ title, slug, subtitle, technologies, categories, links, date, ai_context }) => ({
            title,
            slug,
            subtitle,
            technologies,
            categories,
            links,
            date,
            ai_context,
          }),
        ),
      );
    },
  });

  const getSelfProjectsBySlug = createTool({
    name: "get_self_projects_by_slug",
    description: "Fetches details for a specific project by slug.",
    schema: z.object({ slug: z.string().min(1) }).strict(),
    handler: async ({ slug }) => {
      const doc = await getProjectBySlug(slug);

      if (!doc) {
        return {
          error:
            "Wrong slug, you might have mistyped it. Please use get_self_projects to get the list of all projects.",
        };
      }

      const {
        title,
        slug: projectSlug,
        subtitle,
        description,
        content,
        links,
        date,
        technologies,
        categories,
        highlights,
        role,
        client,
        teamSize,
        ai_context,
      } = doc;
      return toJsonable({
        title,
        slug: projectSlug,
        subtitle,
        description,
        content,
        links,
        date,
        technologies,
        categories,
        highlights,
        role,
        client,
        teamSize,
        ai_context,
      });
    },
  });

  const getSelfNotes = createTool({
    name: "get_self_notes",
    description: "Returns a lightweight list of Mathis notes.",
    schema: z.object({}).strict(),
    handler: async () => {
      const notes = await getAllNotes();
      return toJsonable(
        notes.map(({ title, slug, excerpt, tags, links, date, author }) => ({
          title,
          slug,
          excerpt,
          tags,
          links,
          date,
          author,
        })),
      );
    },
  });

  const getSelfNotesBySlug = createTool({
    name: "get_self_notes_by_slug",
    description: "Fetches details for a specific note by slug.",
    schema: z.object({ slug: z.string().min(1) }).strict(),
    handler: async ({ slug }) => {
      const doc = await getNoteBySlug(slug);

      if (!doc) {
        return {
          error:
            "Wrong slug, you might have mistyped it. Please use get_self_notes to get the list of all notes.",
        };
      }

      const { title, slug: noteSlug, excerpt, content, tags, links, date, author } = doc;
      return toJsonable({
        title,
        slug: noteSlug,
        excerpt,
        content,
        tags,
        links,
        date,
        author,
      });
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
