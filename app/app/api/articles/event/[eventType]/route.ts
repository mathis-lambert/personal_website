import { NextResponse, type NextRequest } from "next/server";

import { getArticleMetrics, updateArticleMetric } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

const EVENT_MAP = new Set(["like", "share", "read"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventType: string }> },
) {
  const { eventType } = await params;
  const type = eventType;
  if (!EVENT_MAP.has(type)) {
    return NextResponse.json(
      { detail: "Unsupported event type" },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    slug?: string;
  };

  if (!body.id && !body.slug) {
    return NextResponse.json(
      { detail: "'id' or 'slug' is required" },
      { status: 400 },
    );
  }

  const metrics = await updateArticleMetric(
    type as "like" | "share" | "read",
    { id: body.id, slug: body.slug },
  );

  if (!metrics) {
    return NextResponse.json(
      { detail: "Article not found" },
      { status: 404 },
    );
  }

  await logEvent(`article_${type}`, body);
  return NextResponse.json({ ok: true, metrics });
}

export async function GET(req: NextRequest) {
  // Compatibility helper: allow GET to mirror /metrics
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id") ?? undefined;
  const slug = searchParams.get("slug") ?? undefined;
  if (!id && !slug) {
    return NextResponse.json(
      { detail: "id or slug is required" },
      { status: 400 },
    );
  }
  const metrics = await getArticleMetrics({ id: id ?? undefined, slug: slug ?? undefined });
  if (!metrics) {
    return NextResponse.json(
      { detail: "Article not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ metrics });
}
