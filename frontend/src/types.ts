import type { LucideIcon } from 'lucide-react';

export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  location: string;
  current?: boolean;
  highlight?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  description?: string;
  period: string;
}

export interface Certification {
  provider: string;
  title: string;
  issued_date: string | null;
  status: "issued" | "running" | "expired";
}

export interface TechnicalSkills {
  languages: string[];
  ai_ml: string[];
  systems_and_infra: string[];
  web: string[];
}

export interface ResumeData {
  name: string;
  contact: Contact;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  technical_skills: TechnicalSkills;
  skills: string[];
  passions: string[];
}

export interface IsLoadingState {
  summary: boolean;
  experience: boolean;
  coverLetter: boolean;
  funFact: boolean;
  pdf: boolean;
}

export interface SectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  delay?: number;
}

// --- Interfaces (assuming these are defined elsewhere or keep them here) ---

export interface ChatCompletionsRequest {
  messages: Message[];
  location: string;
}

export interface Message {
  role: string;
  content: string;
  reasoning?: string | null;
  reasoning_content?: string | null;
}

// (Ancien format supprimé)

// --- OpenAI-like SSE chunk format support ---

export type FinishReason =
  | 'stop'
  | 'length'
  | 'content_filter'
  | 'tool_calls'
  | string;

export interface OpenAIChoiceDelta {
  index: number;
  delta: {
    role: 'system' | 'user' | 'assistant' | null;
    content: string | null;
    reasoning_content?: string | null;
    reasoning?: string | null;
  };
  logprobs: unknown | null;
  finish_reason: FinishReason | null;
}

export interface OpenAIChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: OpenAIChoiceDelta[];
  system_fingerprint?: string | null;
}

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning?: string | null;
  reasoning_content?: string | null;
}

export interface OpenAIChoiceCompletion {
  index: number;
  message: OpenAIChatMessage;
  finish_reason: FinishReason;
  logprobs?: unknown | null;
}

export interface OpenAIChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: OpenAIChoiceCompletion[];
  system_fingerprint?: string | null;
}

// --- Types d'API internes (format simplifié mais aligné OpenAI) ---

export interface ApiStreamChunk {
  content: string; // delta.content
  reasoning?: string | null; // delta.reasoning
  reasoning_content?: string | null; // delta.reasoning_content
  finish_reason: FinishReason | null;
  id: string; // completion id
}

export interface ApiCompletionResult {
  result: string; // contenu agrégé
  reasoning?: string | null; // contenu de raisonnement agrégé
  reasoning_content?: string | null; // contenu de raisonnement agrégé (alternative)
  finish_reason: FinishReason; // raison de fin de l'API
  id: string; // completion id
}

// --- State and Action Types for Reducer ---

export interface ChatState {
  result: string;
  reasoning?: string | null;
  reasoning_content?: string | null;
  finishReason: FinishReason | null;
  jobId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export type ChatAction =
  | { type: 'FETCH_START' }
  | { type: 'STREAM_CHUNK'; payload: ApiStreamChunk }
  | { type: 'STREAM_DONE'; payload: ApiCompletionResult }
  | { type: 'FETCH_SUCCESS'; payload: ApiCompletionResult }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'RESET' };

// ---------------- Projects / Works DTO ----------------

export type ProjectStatus = 'completed' | 'in-progress' | 'archived';

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
  id: string;
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
  // Backward-compat flat fields
  imageUrl?: string;
  thumbnailUrl?: string;
  projectUrl?: string;
  repoUrl?: string;
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

// ---------------- Blog / Articles DTO ----------------

export interface ArticleLinks {
  canonical?: string; // canonical URL
  discussion?: string; // link to discussion/thread
}

export interface ArticleMedia {
  thumbnailUrl?: string;
  imageUrl?: string;
  gallery?: string[];
}

export interface ArticleMetrics {
  views?: number;
  likes?: number;
  shares?: number;
}

export interface Article {
  id: string;
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
  imageUrl?: string;
  thumbnailUrl?: string;
  links?: ArticleLinks;
  media?: ArticleMedia;
  metrics?: ArticleMetrics;
}
