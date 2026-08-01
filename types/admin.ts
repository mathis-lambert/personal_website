import type { ResumeData } from "@/types/resume";

export type AdminCollectionName =
  | "projects"
  | "notes"
  | "experiences"
  | "studies"
  | "resume";

export type AdminListCollectionName = Exclude<AdminCollectionName, "resume">;

export type AdminUpdateResumeInput = Partial<ResumeData>;
