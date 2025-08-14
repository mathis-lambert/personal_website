import type {
  Article,
  ArticleLinks,
  ArticleMedia,
  ArticleMetrics,
} from '@/types';
import { fetchWithTimeout, sanitizeUrl } from '@/api/utils';

export type ApiArticle = Partial<Article> & {
  links?: Partial<ArticleLinks>;
  media?: Partial<ArticleMedia>;
  metrics?: Partial<ArticleMetrics>;
};

export function normalizeArticleApi(a: ApiArticle): Article {
  const links = a.links || {};
  return {
    id: String(a.id ?? ''),
    slug: a.slug,
    title: a.title ?? '',
    excerpt: a.excerpt ?? '',
    content: a.content ?? '',
    author: a.author ?? 'Unknown',
    date: a.date ?? new Date().toISOString(),
    readTimeMin: typeof a.readTimeMin === 'number' ? a.readTimeMin : undefined,
    tags: Array.isArray(a.tags) ? a.tags : [],
    categories: Array.isArray(a.categories) ? a.categories : [],
    isFeatured: Boolean(a.isFeatured),
    imageUrl: a.imageUrl,
    thumbnailUrl: a.thumbnailUrl,
    links: {
      canonical: sanitizeUrl(links.canonical),
      discussion: sanitizeUrl(links.discussion),
    },
    media: {
      thumbnailUrl: a.media?.thumbnailUrl,
      imageUrl: a.media?.imageUrl,
      gallery: a.media?.gallery,
    },
    metrics: a.metrics,
  };
}

export async function getArticles(options?: {
  token?: string;
  signal?: AbortSignal;
}): Promise<Article[]> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');
  const res = await fetchWithTimeout(`${apiUrl}/api/articles/all`, {
    signal: options?.signal,
    timeoutMs: 10000,
    authToken: options?.token,
  });
  if (!res.ok) throw new Error(`Articles request failed: ${res.status}`);
  const data = await res.json();
  const apiArticles = Array.isArray(data?.articles)
    ? (data.articles as ApiArticle[])
    : [];
  return apiArticles.map(normalizeArticleApi);
}

export async function getArticleBySlug(
  slug: string,
  options?: { token?: string; signal?: AbortSignal },
): Promise<Article | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');

  try {
    const res = await fetchWithTimeout(`${apiUrl}/api/articles/${slug}`, {
      signal: options?.signal,
      timeoutMs: 10000,
      authToken: options?.token,
    });
    if (res.ok) {
      const data = await res.json();
      const a = (data?.article ?? data) as ApiArticle | undefined;
      return a ? normalizeArticleApi(a) : null;
    }
    if (res.status !== 404) {
      throw new Error(`Article request failed: ${res.status}`);
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null;
  }
  return null;
}

// ---- Events tracking ----
export type ArticleEventType = 'like' | 'share' | 'read';

export async function sendArticleEvent(
  type: ArticleEventType,
  payload: { id?: string; slug?: string },
  options?: { token?: string; signal?: AbortSignal },
): Promise<ArticleMetrics | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetchWithTimeout(`${apiUrl}/api/articles/event/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: payload.id, slug: payload.slug }),
      signal: options?.signal,
      timeoutMs: 8000,
      authToken: options?.token,
    });
    if (!res.ok) {
      console.warn('Article event failed', type, res.status);
      return null;
    }
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      metrics?: Partial<ArticleMetrics>;
    } | null;
    const m = data?.metrics ?? undefined;
    if (!m) return null;
    return {
      views: typeof m.views === 'number' ? m.views : undefined,
      likes: typeof m.likes === 'number' ? m.likes : undefined,
      shares: typeof m.shares === 'number' ? m.shares : undefined,
    };
  } catch (e) {
    console.warn('Article event exception', type, e);
    return null;
  }
}

export async function trackArticleRead(
  article: Article,
  options?: { token?: string; signal?: AbortSignal },
) {
  return sendArticleEvent(
    'read',
    { id: article.id, slug: article.slug },
    options,
  );
}

export async function trackArticleLike(
  article: Article,
  options?: { token?: string; signal?: AbortSignal },
) {
  return sendArticleEvent(
    'like',
    { id: article.id, slug: article.slug },
    options,
  );
}

export async function trackArticleShare(
  article: Article,
  options?: { token?: string; signal?: AbortSignal },
) {
  return sendArticleEvent(
    'share',
    { id: article.id, slug: article.slug },
    options,
  );
}

export async function getArticleMetrics(
  payload: { id?: string; slug?: string },
  options?: { token?: string; signal?: AbortSignal },
): Promise<ArticleMetrics | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not configured');
  const usp = new URLSearchParams();
  if (payload.id) usp.set('id', String(payload.id));
  if (payload.slug && !payload.id) usp.set('slug', payload.slug);
  const res = await fetchWithTimeout(
    `${apiUrl}/api/articles/metrics?${usp.toString()}`,
    {
      signal: options?.signal,
      timeoutMs: 8000,
      authToken: options?.token,
    },
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as {
    metrics?: Partial<ArticleMetrics>;
  } | null;
  const m = data?.metrics ?? undefined;
  if (!m) return null;
  return {
    views: typeof m.views === 'number' ? m.views : undefined,
    likes: typeof m.likes === 'number' ? m.likes : undefined,
    shares: typeof m.shares === 'number' ? m.shares : undefined,
  };
}
