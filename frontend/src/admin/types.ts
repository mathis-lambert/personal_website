import type { Article, Project, ResumeData } from '@/types';

// Simple list entries stored in experiences.json and studies.json
export interface AdminExperience {
  title: string;
  company: string;
  date: string;
  description: string;
}

export interface AdminStudy {
  title: string;
  company: string;
  date: string;
  description: string;
}

// Create inputs (required fields, others optional)
export type AdminCreateProjectInput = Pick<Project, 'title' | 'date' | 'technologies'> &
  Partial<Omit<Project, 'id' | 'date' | 'title' | 'technologies'>>;

export type AdminCreateArticleInput = Pick<
  Article,
  'title' | 'excerpt' | 'content' | 'date' | 'tags'
> &
  Partial<Omit<Article, 'id' | 'title' | 'excerpt' | 'content' | 'date' | 'tags'>>;

export type AdminUpdateProjectInput = Partial<Project>;
export type AdminUpdateArticleInput = Partial<Article>;
export type AdminUpdateResumeInput = Partial<ResumeData>;
