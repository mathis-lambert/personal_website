import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { parseCommonAnalyticsParams } from "@/lib/analytics/adminQuery";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getAnalyticsOverview } from "@/lib/data/analytics";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const data = await getAnalyticsOverview(parseCommonAnalyticsParams(req));
  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/overview",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
