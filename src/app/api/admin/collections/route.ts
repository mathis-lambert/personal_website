import { NextResponse } from "next/server";

import { listCollections } from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

export async function GET() {
  const isAdmin = await requireAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const collections = listCollections().map((name) => ({ name }));
  return NextResponse.json({ collections });
}
