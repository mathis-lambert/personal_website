import type {
  Project,
  ProjectLinks,
  ProjectMedia,
  ProjectMetrics,
} from '@/types';
import { fetchWithTimeout } from './utils';

export type ApiProject = Partial<Project> & {
  links?: Partial<ProjectLinks>;
  media?: Partial<ProjectMedia>;
  metrics?: Partial<ProjectMetrics>;
};

export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;
  return url.replace(/:\s*\/\//, '://');
}

export function normalizeProjectApi(p: ApiProject): Project {
  const links = p.links || {};
  return {
    id: String(p.id ?? ''),
    slug: p.slug,
    title: p.title ?? '',
    subtitle: p.subtitle,
    description: p.description,
    content: p.content,
    date: p.date ?? new Date().toISOString(),
    startDate: p.startDate,
    endDate: p.endDate,
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    categories: Array.isArray(p.categories) ? p.categories : [],
    status: p.status,
    isFeatured: Boolean(p.isFeatured),
    links: {
      live: sanitizeUrl(links.live),
      repo: sanitizeUrl(links.repo),
      docs: sanitizeUrl(links.docs),
      video: sanitizeUrl(links.video),
    },
    media: {
      thumbnailUrl: p.media?.thumbnailUrl,
      imageUrl: p.media?.imageUrl,
      gallery: p.media?.gallery,
      videoUrl: sanitizeUrl(p.media?.videoUrl),
    },
    metrics: p.metrics,
    role: p.role,
    client: p.client,
    teamSize: p.teamSize,
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    color: p.color,
  };
}

export async function getProjects(options?: {
  token?: string;
  signal?: AbortSignal;
}): Promise<Project[]> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');
  const res = await fetchWithTimeout(`${apiUrl}/api/projects/all`, {
    signal: options?.signal,
    timeoutMs: 10000,
    authToken: options?.token,
  });
  if (!res.ok) {
    throw new Error(`Projects request failed: ${res.status}`);
  }
  const data = await res.json();
  const apiProjects = Array.isArray(data?.projects)
    ? (data.projects as ApiProject[])
    : [];
  return apiProjects.map(normalizeProjectApi);
}

export async function getProjectBySlug(
  slug: string,
  options?: { token?: string; signal?: AbortSignal },
): Promise<Project | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');

  try {
    const res = await fetchWithTimeout(`${apiUrl}/api/projects/${slug}`, {
      signal: options?.signal,
      timeoutMs: 10000,
      authToken: options?.token,
    });
    if (res.ok) {
      const data = await res.json();
      const p = (data?.project ?? data) as ApiProject | undefined;
      return p ? normalizeProjectApi(p) : null;
    }
    if (res.status !== 404) {
      throw new Error(`Project request failed: ${res.status}`);
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null;
  }

  return null;
}
