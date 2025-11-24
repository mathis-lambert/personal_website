import { NextResponse, type NextRequest } from "next/server";

import { analyticsEvents } from "@/lib/data/events";
import { requireAdminSession } from "@/lib/auth/helpers";

export async function GET(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;
  const granularity =
    (searchParams.get("granularity") as "hour" | "day" | "month" | null) ??
    undefined;
  const action = searchParams.get("action") ?? undefined;
  const groupBy =
    (searchParams.get("group_by") as "action" | "location" | null) ||
    undefined;

  const data = await analyticsEvents({
    start,
    end,
    granularity,
    action,
    groupBy,
  });
  return NextResponse.json(data);
}
