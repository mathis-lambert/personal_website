export interface TimelineEntry {
  title: string;
  company: string;
  date: string;
  description: string;
  hide?: boolean;
}

export type ProjectStatus = "completed" | "in-progress" | "archived";
export type EditorialStatus = "draft" | "published" | "archived";

interface ProjectLinks {
  live?: string;
  repo?: string;
  docs?: string;
  video?: string;
}

interface ProjectMedia {
  thumbnailUrl?: string;
  imageUrl?: string;
  gallery?: string[];
  videoUrl?: string;
}

interface ProjectMetrics {
  stars?: number;
  downloads?: number;
  users?: number;
}

interface AiContext {
  llm_purpose: string;
  routing: {
    internal_page: string;
    external_links: string[];
  };
  capabilities: string[];
  key_tech: string[];
  claims: string[];
  limitations: string[];
  faq_snippets: Array<{ q: string; a: string }>;
  linking_rules: string[];
  tags: string[];
}

export interface Project {
  _id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  categories?: string[];
  status?: ProjectStatus;
  isFeatured?: boolean;
  editorialStatus?: EditorialStatus;
  draftRevision?: number;
  publishedDraftRevision?: number;
  publishedVersion?: number;
  publishedAt?: string;
  hasUnpublishedChanges?: boolean;
  createdAt?: string;
  updatedAt?: string;
  links?: ProjectLinks;
  media?: ProjectMedia;
  metrics?: ProjectMetrics;
  role?: string;
  client?: string;
  teamSize?: number;
  highlights?: string[];
  color?: string;
  ai_context?: AiContext;
}

interface NoteLinks {
  canonical?: string;
  discussion?: string;
}

interface NoteMedia {
  thumbnailUrl?: string;
  imageUrl?: string;
  gallery?: string[];
}

interface NoteMetrics {
  views?: number;
  likes?: number;
  shares?: number;
}

export interface Note {
  _id: string;
  slug?: string;
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  date: string;
  readTimeMin?: number;
  tags: string[];
  categories?: string[];
  isFeatured?: boolean;
  editorialStatus?: EditorialStatus;
  draftRevision?: number;
  publishedDraftRevision?: number;
  publishedVersion?: number;
  publishedAt?: string;
  hasUnpublishedChanges?: boolean;
  createdAt?: string;
  updatedAt?: string;
  links?: NoteLinks;
  media?: NoteMedia;
  metrics?: NoteMetrics;
}
