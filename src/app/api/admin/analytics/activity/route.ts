import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  parseCommonAnalyticsParams,
  parsePositiveInt,
} from "@/lib/analytics/adminQuery";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getAnalyticsActivity } from "@/lib/data/analytics";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const typeParam = req.nextUrl.searchParams.get("type") ?? undefined;
  const type =
    typeParam === "api" || typeParam === "ui" || typeParam === "all"
      ? typeParam
      : undefined;

  const data = await getAnalyticsActivity({
    ...parseCommonAnalyticsParams(req),
    type,
    limit: parsePositiveInt(req, "limit"),
    skip: parsePositiveInt(req, "skip"),
  });
  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/activity",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
