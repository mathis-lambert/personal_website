import { NextResponse, type NextRequest } from "next/server";

import { getArticleMetrics } from "@/lib/data/content";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id") ?? undefined;
  const slug = searchParams.get("slug") ?? undefined;
  if (!id && !slug) {
    return NextResponse.json(
      { detail: "Query param 'id' or 'slug' is required" },
      { status: 400 },
    );
  }
  if (id && slug) {
    return NextResponse.json(
      { detail: "Provide only one of 'id' or 'slug'" },
      { status: 400 },
    );
  }
  const metrics = await getArticleMetrics({ id, slug });
  if (!metrics) {
    return NextResponse.json(
      { detail: "Article not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ metrics });
}
