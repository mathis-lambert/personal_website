import type {
  Project,
  ProjectLinks,
  ProjectMedia,
  ProjectMetrics,
} from '@/types';

export type ApiProject = Partial<Project> & {
  links?: Partial<ProjectLinks>;
  media?: Partial<ProjectMedia>;
  metrics?: Partial<ProjectMetrics>;
};

type FetchWithTimeoutInit = RequestInit & { timeoutMs?: number };

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 10000;
  const parentSignal = init?.signal;
  const controller = new AbortController();

  const onParentAbort = () => controller.abort();
  if (parentSignal) {
    if (parentSignal.aborted) onParentAbort();
    else parentSignal.addEventListener('abort', onParentAbort);
  }

  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException('Timeout', 'AbortError'));
    } catch {
      controller.abort();
    }
  }, timeoutMs);

  try {
    const {
      timeoutMs: _ignoredTimeout,
      signal: _ignoredSignal,
      ...rest
    } = init ?? {};
    void _ignoredTimeout;
    void _ignoredSignal;
    return await fetch(input, {
      ...(rest as RequestInit),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (parentSignal) parentSignal.removeEventListener('abort', onParentAbort);
  }
}

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
    description: p.description ?? '',
    date: p.date ?? new Date().toISOString(),
    startDate: p.startDate,
    endDate: p.endDate,
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    categories: Array.isArray(p.categories) ? p.categories : [],
    status: p.status,
    isFeatured: Boolean(p.isFeatured),
    imageUrl: p.imageUrl,
    thumbnailUrl: p.thumbnailUrl,
    projectUrl: sanitizeUrl(p.projectUrl),
    repoUrl: sanitizeUrl(p.repoUrl),
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
  signal?: AbortSignal;
}): Promise<Project[]> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');
  const res = await fetchWithTimeout(`${apiUrl}/api/projects/all`, {
    signal: options?.signal,
    timeoutMs: 10000,
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
  options?: { signal?: AbortSignal },
): Promise<Project | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');

  try {
    const res = await fetchWithTimeout(`${apiUrl}/api/projects/${slug}`, {
      signal: options?.signal,
      timeoutMs: 10000,
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
