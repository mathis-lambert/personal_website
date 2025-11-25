import type { Article, Project, ResumeData } from "@/types";

// Create inputs (required fields, others optional)
export type AdminCreateProjectInput = Pick<
  Project,
  "title" | "date" | "technologies"
> &
  Partial<Omit<Project, "_id" | "date" | "title" | "technologies">>;

export type AdminCreateArticleInput = Pick<
  Article,
  "title" | "excerpt" | "content" | "date" | "tags"
> &
  Partial<
    Omit<Article, "_id" | "title" | "excerpt" | "content" | "date" | "tags">
  >;

export type AdminUpdateProjectInput = Partial<Omit<Project, "_id">>;
export type AdminUpdateArticleInput = Partial<Omit<Article, "_id">>;
export type AdminUpdateResumeInput = Partial<ResumeData>;
