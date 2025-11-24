import { NextResponse, type NextRequest } from "next/server";

import { getArticleBySlug } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return NextResponse.json(
      { detail: "Article not found" },
      { status: 404 },
    );
  }
  await logEvent("get_article_by_slug", { slug });
  return NextResponse.json({ article });
}
