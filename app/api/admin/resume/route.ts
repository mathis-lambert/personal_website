import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { upsertResume } from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const patchHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const patch = (await req.json()) as Record<string, unknown>;
  const item = await upsertResume(patch);
  return NextResponse.json({ ok: true, item });
};

export const PATCH = withApiAnalytics(
  {
    route: "/api/admin/resume",
    actorType: "admin",
  },
  patchHandler,
);
