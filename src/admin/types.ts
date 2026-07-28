import type { Note, Project, ResumeData } from "@/types";

// Create inputs (required fields, others optional)
export type AdminCreateProjectInput = Pick<
  Project,
  "title" | "date" | "technologies"
> &
  Partial<Omit<Project, "_id" | "date" | "title" | "technologies">>;

export type AdminCreateNoteInput = Pick<
  Note,
  "title" | "excerpt" | "content" | "date" | "tags"
> &
  Partial<
    Omit<Note, "_id" | "title" | "excerpt" | "content" | "date" | "tags">
  >;

export type AdminUpdateProjectInput = Partial<Omit<Project, "_id">>;
export type AdminUpdateNoteInput = Partial<Omit<Note, "_id">>;
export type AdminUpdateResumeInput = Partial<ResumeData>;
