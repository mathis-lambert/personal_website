import type { Article, Project, ResumeData } from '@/types';

// Create inputs (required fields, others optional)
export type AdminCreateProjectInput = Pick<
  Project,
  'title' | 'date' | 'technologies'
> &
  Partial<Omit<Project, 'id' | 'date' | 'title' | 'technologies'>>;

export type AdminCreateArticleInput = Pick<
  Article,
  'title' | 'excerpt' | 'content' | 'date' | 'tags'
> &
  Partial<
    Omit<Article, 'id' | 'title' | 'excerpt' | 'content' | 'date' | 'tags'>
  >;

export type AdminUpdateProjectInput = Partial<Project>;
export type AdminUpdateArticleInput = Partial<Article>;
export type AdminUpdateResumeInput = Partial<ResumeData>;
