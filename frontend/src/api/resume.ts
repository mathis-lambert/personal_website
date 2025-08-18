import type { ResumeData } from '@/types';
import { fetchWithTimeout } from './utils';

export function normalizeResumeApi(p: ResumeData): ResumeData {
  return {
    name: p.name,
    contact: p.contact,
    summary: p.summary,
    experiences: p.experiences,
    education: p.education,
    technologies: p.technologies,
    skills: p.skills,
    passions: p.passions,
  };
}

export async function getResume(options?: {
  token?: string;
  signal?: AbortSignal;
}): Promise<ResumeData> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');
  const res = await fetchWithTimeout(`${apiUrl}/api/resume`, {
    signal: options?.signal,
    timeoutMs: 10000,
    authToken: options?.token,
  });
  if (!res.ok) {
    throw new Error(`Resumes request failed: ${res.status}`);
  }
  const data = await res.json();
  return normalizeResumeApi(data.resume);
}
