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
