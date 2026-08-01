import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import { createMediaAsset, listMediaAssets } from "@/lib/data/media";
import { validateImageUpload } from "@/lib/media/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const query = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 60);
  return NextResponse.json({ items: await listMediaAssets(query, limit) });
};

const postHandler = async (req: NextRequest) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "An image is required." }, { status: 400 });
    }
    validateImageUpload(file);
    const asset = await createMediaAsset(file, String(data.get("alt") ?? ""));
    return NextResponse.json({ item: asset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
};

export const GET = withApiAnalytics(
  { route: "/api/admin/media", actorType: "admin", captureRequestBody: false },
  getHandler,
);

export const POST = withApiAnalytics(
  { route: "/api/admin/media", actorType: "admin", captureRequestBody: false },
  postHandler,
);
