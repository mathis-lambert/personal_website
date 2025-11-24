import { NextResponse } from "next/server";

import { getAllArticles, getAllProjects } from "@/lib/data/content";
import { buildSitemapXml } from "@/lib/sitemap";

export async function GET() {
  const [projects, articles] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
  ]);

  const baseUrl =
    process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "https://mathislambert.fr";

  const xml = buildSitemapXml({ baseUrl, projects, articles });
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}
