export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface Experience {
  role: string;
  position?: string;
  company: string;
  logo?: string;
  period: string;
  location: string;
  current?: boolean;
  highlight?: boolean;
  hide?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  location?: string;
  description?: string;
  period: string;
}

export interface Certification {
  provider: string;
  title: string;
  issued_date: string | null;
  status: "issued" | "in progress" | "stopped" | "starting";
  description?: string;
}

export interface TechnicalSkills {
  languages: string[];
  programming: string[];
  ai_ml: string[];
  systems_and_infra: string[];
  web: string[];
}

export interface ResumeContent {
  name: string;
  contact: Contact;
  personal_statement: string;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  technical_skills: TechnicalSkills;
  skills: string[];
  passions: string[];
}

export interface ResumeTranslations {
  fr?: Partial<ResumeContent>;
}

export interface ResumeData extends ResumeContent {
  translations?: ResumeTranslations;
}

export interface TimelineEntry {
  title: string;
  company: string;
  date: string;
  description: string;
}

// --- Interfaces (assuming these are defined elsewhere or keep them here) ---

// ---------------- Projects / Works DTO ----------------

export type ProjectStatus = "completed" | "in-progress" | "archived";

export interface ProjectLinks {
  live?: string; // Live demo or website
  repo?: string; // Source code repository
  docs?: string; // Documentation
  video?: string; // Demo video
}

export interface ProjectMedia {
  thumbnailUrl?: string; // Thumbnail used in list/cards
  imageUrl?: string; // Backward-compat: main image
  gallery?: string[]; // Optional gallery for detail page
  videoUrl?: string; // Embedded/hosted video
}

export interface ProjectMetrics {
  stars?: number;
  downloads?: number;
  users?: number;
}

// Shared Project interface for cards, list and detail view
export interface Project {
  _id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  date: string; // canonical date for sorting (usually end date)
  startDate?: string;
  endDate?: string;
  technologies: string[];
  categories?: string[];
  status?: ProjectStatus;
  isFeatured?: boolean;
  // Structured fields
  links?: ProjectLinks;
  media?: ProjectMedia;
  metrics?: ProjectMetrics;
  // Contextual info
  role?: string;
  client?: string;
  teamSize?: number;
  highlights?: string[];
  color?: string; // accent color for card/header theming

  ai_context?: AiContext;
}

export interface AiContext {
  llm_purpose: string;
  routing: {
    internal_page: string;
    external_links: string[];
  };
  capabilities: string[];
  key_tech: string[];
  claims: string[];
  limitations: string[];
  faq_snippets: {
    q: string;
    a: string;
  }[];
  linking_rules: string[];
  tags: string[];
}

// ---------------- Notes DTO ----------------

export interface NoteLinks {
  canonical?: string; // canonical URL
  discussion?: string; // link to discussion/thread
}

export interface NoteMedia {
  thumbnailUrl?: string;
  imageUrl?: string;
  gallery?: string[];
}

export interface NoteMetrics {
  views?: number;
  likes?: number;
  shares?: number;
}

export interface Note {
  _id: string;
  slug?: string;
  title: string;
  excerpt: string;
  content: string; // markdown or html
  author?: string;
  date: string; // canonical date for sorting
  readTimeMin?: number; // estimated reading time in minutes
  tags: string[];
  categories?: string[];
  isFeatured?: boolean;
  links?: NoteLinks;
  media?: NoteMedia;
  metrics?: NoteMetrics;
}

export type AnalyticsGranularity = "hour" | "day" | "month";

export type ApiActorType = "public" | "admin" | "system";

export type ChatConversationStatus = "active" | "errored";
export type ChatTurnStatus = "pending" | "completed" | "failed";

export interface ChatConversationListItem {
  conversationId: string;
  sessionId?: string;
  location?: string;
  actorType: "public";
  startedAt: string;
  lastMessageAt: string;
  turnCount: number;
  successfulTurns: number;
  failedTurns: number;
  status: ChatConversationStatus;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
}

export interface ChatConversationDetail extends ChatConversationListItem {
  lastError?: string;
}

export interface ChatConversationTurnItem {
  turnId: string;
  conversationId: string;
  turnIndex: number;
  status: ChatTurnStatus;
  streamed: boolean;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  route: string;
  path: string;
  location?: string;
  requestMessages: Array<{ role: string; content: string; name?: string }>;
  lastUserMessage?: string;
  assistantMessage?: string;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  errorMessage?: string;
}

export interface AdminConversationsListResponse {
  ok: boolean;
  total: number;
  items: ChatConversationListItem[];
}

export interface AdminConversationDetailResponse {
  ok: boolean;
  item: ChatConversationDetail | null;
}

export interface AdminConversationTurnsResponse {
  ok: boolean;
  total: number;
  items: ChatConversationTurnItem[];
}

// ---------------- Admin insights ----------------

export type InsightsGranularity = "hour" | "day" | "month";

/** A headline number and the same number over the preceding period. */
export interface InsightMetric {
  value: number;
  previous: number;
}

export interface AdminInsights {
  range: { start: string; end: string; granularity: InsightsGranularity };
  kpis: {
    visitors: InsightMetric;
    pageViews: InsightMetric;
    conversations: InsightMetric;
    resumeDownloads: InsightMetric;
  };
  traffic: { bucket: string; visitors: number; views: number }[];
  content: {
    kind: "project" | "note";
    slug: string;
    title: string;
    opens: number;
  }[];
  pages: { path: string; views: number; visitors: number }[];
  referrers: { source: string; visits: number }[];
  engagement: {
    chatOpened: number;
    chatSubmitted: number;
    outboundClicks: number;
    shares: number;
  };
  questions: {
    conversationId: string;
    at: string;
    question: string;
    failed: boolean;
  }[];
  health: {
    requests: number;
    errors: number;
    errorRate: number;
    slowest: { route: string; p95: number }[];
  };
}

export type AdminCollectionName =
  | "projects"
  | "notes"
  | "experiences"
  | "studies"
  | "resume";

export type AdminListCollectionName = Exclude<AdminCollectionName, "resume">;
