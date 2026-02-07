import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  parseCommonAnalyticsParams,
  parsePositiveInt,
} from "@/lib/analytics/adminQuery";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getAnalyticsEndpoints } from "@/lib/data/analytics";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const data = await getAnalyticsEndpoints({
    ...parseCommonAnalyticsParams(req),
    limit: parsePositiveInt(req, "limit"),
  });
  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/endpoints",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
