import type { Article, Project } from "@/types";

const isoDate = (value?: string | null) => {
  try {
    if (value) {
      const dt = new Date(value);
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  } catch {
    // ignore
  }
  return new Date().toISOString().slice(0, 10);
};

export const buildSitemapXml = (params: {
  baseUrl: string;
  projects: Project[];
  articles: Article[];
}) => {
  const base = params.baseUrl.replace(/\/$/, "");
  const staticPaths: Array<[string, string]> = [
    [`${base}/`, isoDate()],
    [`${base}/projects`, isoDate()],
    [`${base}/blog`, isoDate()],
    [`${base}/resume`, isoDate()],
  ];

  const projectPaths: Array<[string, string]> = params.projects
    .filter((p) => p.slug)
    .map((p) => [`${base}/projects/${p.slug}`, isoDate(p.date)]);

  const articlePaths: Array<[string, string]> = params.articles
    .filter((a) => a.slug)
    .map((a) => [`${base}/blog/${a.slug}`, isoDate(a.date)]);

  const entries = [...staticPaths, ...projectPaths, ...articlePaths]
    .map(
      ([loc, lastmod]) =>
        `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("\n");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries +
    "\n</urlset>\n"
  );
};
