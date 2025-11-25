import { NextResponse, type NextRequest } from "next/server";

import { listEvents } from "@/lib/data/events";
import { requireAdminSession } from "@/lib/auth/helpers";

export async function GET(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const limit = searchParams.get("limit");
  const skip = searchParams.get("skip");
  const sort = searchParams.get("sort") ?? undefined;

  const data = await listEvents({
    start,
    end,
    action,
    limit: limit ? parseInt(limit, 10) : undefined,
    skip: skip ? parseInt(skip, 10) : undefined,
    sort: sort === "asc" ? "asc" : "desc",
  });

  return NextResponse.json({ ok: true, ...data });
}
