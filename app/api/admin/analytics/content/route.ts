import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import {
  getContentAnalytics,
  resolveContentAnalyticsSlug,
} from "@/lib/data/contentInsights";
import type { ContentAnalyticsKind } from "@/types/analytics";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const kind = req.nextUrl.searchParams.get("kind");
  const itemId = req.nextUrl.searchParams.get("itemId")?.trim();
  if ((kind !== "project" && kind !== "note") || !itemId) {
    return NextResponse.json(
      { detail: "A valid content kind and item id are required" },
      { status: 400 },
    );
  }

  const slug = await resolveContentAnalyticsSlug(
    kind as ContentAnalyticsKind,
    itemId,
  );
  if (!slug) {
    return NextResponse.json({ detail: "Content not found" }, { status: 404 });
  }

  const insights = await getContentAnalytics({
    kind: kind as ContentAnalyticsKind,
    slug,
    start: req.nextUrl.searchParams.get("start") ?? undefined,
    end: req.nextUrl.searchParams.get("end") ?? undefined,
  });

  return NextResponse.json(insights);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/content",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
