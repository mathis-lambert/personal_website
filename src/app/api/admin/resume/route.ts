import { NextResponse, type NextRequest } from "next/server";

import { upsertResume } from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

export async function PATCH(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const patch = await req.json();
  const item = await upsertResume(patch);
  return NextResponse.json({ ok: true, item });
}
