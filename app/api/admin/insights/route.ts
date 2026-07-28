import { NextResponse, type NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/helpers";
import { withApiAnalytics } from "@/lib/analytics/server";
import { getInsights } from "@/lib/data/insights";

const handler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const insights = await getInsights({
    start: params.get("start") ?? undefined,
    end: params.get("end") ?? undefined,
  });

  return NextResponse.json(insights);
};

export const GET = withApiAnalytics(
  { route: "/api/admin/insights", actorType: "admin" },
  handler,
);
