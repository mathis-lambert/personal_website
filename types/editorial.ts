import type { Note, Project } from "@/types";

export type EditorialCollection = "projects" | "notes";
export type EditorialItem = Project | Note;

export type EditorialRuntimeField =
  | "_id"
  | "createdAt"
  | "updatedAt"
  | "editorialStatus"
  | "draftRevision"
  | "publishedDraftRevision"
  | "publishedVersion"
  | "publishedAt"
  | "hasUnpublishedChanges";

export type ProjectSnapshot = Omit<Project, EditorialRuntimeField>;
export type NoteSnapshot = Omit<Note, EditorialRuntimeField>;
export type EditorialSnapshot = ProjectSnapshot | NoteSnapshot;

export type EditorialPublicationSummary = {
  _id: string;
  collection: EditorialCollection;
  contentId: string;
  version: number;
  title: string;
  summary?: string;
  publishedAt: string;
  sourceDraftRevision: number;
  restoredFromVersion?: number;
};
