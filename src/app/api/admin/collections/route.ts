import { NextResponse } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { listCollections } from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const getHandler = async () => {
  const isAdmin = await requireAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const collections = listCollections().map((name) => ({ name }));
  return NextResponse.json({ collections });
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/collections",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
