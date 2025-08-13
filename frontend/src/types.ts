import type { LucideIcon } from 'lucide-react';

export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  website: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  location: string;
  isCurrent?: boolean;
  highlight?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
}

export interface ResumeData {
  name: string;
  contact: Contact;
  summary: string;
  experiences: Experience[];
  education: Education[];
  technologies: string[];
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
  input: string;
  history: Message[];
}

export interface Message {
  role: string;
  content: string;
}

export interface ChatCompletionsChunk {
  chunk: string;
  finish_reason: string | null;
  job_id: string;
}

export interface ChatCompletionsResult {
  result: string;
  finish_reason: string;
  job_id: string;
}

// --- State and Action Types for Reducer ---

export interface ChatState {
  result: string;
  finishReason: string | null;
  jobId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export type ChatAction =
  | { type: 'FETCH_START' }
  | { type: 'STREAM_CHUNK'; payload: ChatCompletionsChunk }
  | { type: 'STREAM_DONE'; payload: ChatCompletionsResult }
  | { type: 'FETCH_SUCCESS'; payload: ChatCompletionsResult }
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
  description: string;
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
}
