import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import { listConversations } from "@/lib/data/conversations";
import { parsePositiveInt } from "@/lib/analytics/adminQuery";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const statusRaw = req.nextUrl.searchParams.get("status") ?? undefined;
  const status =
    statusRaw === "active" || statusRaw === "errored" ? statusRaw : undefined;

  const data = await listConversations({
    start: req.nextUrl.searchParams.get("start") ?? undefined,
    end: req.nextUrl.searchParams.get("end") ?? undefined,
    status,
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    sessionId: req.nextUrl.searchParams.get("session_id") ?? undefined,
    limit: parsePositiveInt(req, "limit"),
    skip: parsePositiveInt(req, "skip"),
  });

  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/conversations",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
