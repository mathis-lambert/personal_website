import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  parseCommonAnalyticsParams,
  parseGranularity,
} from "@/lib/analytics/adminQuery";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getAnalyticsTimeseries } from "@/lib/data/analytics";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const common = parseCommonAnalyticsParams(req);
  const data = await getAnalyticsTimeseries({
    ...common,
    granularity: parseGranularity(req),
  });
  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/timeseries",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
