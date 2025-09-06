import type { TimelineData } from '@/components/ui/ScrollableTimeline';
import { fetchWithTimeout } from './utils';

export type ApiStudy = Partial<TimelineData>;

export function normalizeStudyApi(s: ApiStudy): TimelineData {
  return {
    title: s.title ?? '',
    company: s.company ?? '',
    date: s.date ?? '',
    description: s.description ?? '',
  };
}

export async function getStudies(options?: {
  signal?: AbortSignal;
}): Promise<TimelineData[]> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');

  const res = await fetchWithTimeout(`${apiUrl}/api/studies/all`, {
    signal: options?.signal,
    timeoutMs: 10_000,
  });

  if (!res.ok) {
    throw new Error(`Studies request failed: ${res.status}`);
  }

  const data = await res.json();
  const apiStudies = Array.isArray(data?.studies)
    ? (data.studies as ApiStudy[])
    : [];

  return apiStudies.map(normalizeStudyApi);
}
