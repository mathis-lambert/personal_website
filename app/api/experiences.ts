import type { TimelineData } from '@/components/ui/ScrollableTimeline';
import { fetchWithTimeout } from './utils';

export type ApiExperience = Partial<TimelineData>;

export function normalizeExperienceApi(e: ApiExperience): TimelineData {
  return {
    title: e.title ?? '',
    company: e.company ?? '',
    date: e.date ?? '',
    description: e.description ?? '',
  };
}

export async function getExperiences(options?: {
  signal?: AbortSignal;
}): Promise<TimelineData[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

  const res = await fetchWithTimeout(`${apiUrl}/api/experiences/all`, {
    signal: options?.signal,
    timeoutMs: 10_000,
  });

  if (!res.ok) {
    throw new Error(`Experiences request failed: ${res.status}`);
  }

  const data = await res.json();
  const apiExperiences = Array.isArray(data?.experiences)
    ? (data.experiences as ApiExperience[])
    : [];

  return apiExperiences.map(normalizeExperienceApi);
}
