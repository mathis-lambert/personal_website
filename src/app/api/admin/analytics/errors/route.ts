import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  parseCommonAnalyticsParams,
  parsePositiveInt,
} from "@/lib/analytics/adminQuery";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getAnalyticsErrors } from "@/lib/data/analytics";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const data = await getAnalyticsErrors({
    ...parseCommonAnalyticsParams(req),
    statusMin: parsePositiveInt(req, "status_min"),
    statusMax: parsePositiveInt(req, "status_max"),
    limit: parsePositiveInt(req, "limit"),
    skip: parsePositiveInt(req, "skip"),
  });
  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/errors",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
