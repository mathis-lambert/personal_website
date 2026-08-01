import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import { deleteMediaAsset, updateMediaAssetAlt } from "@/lib/data/media";

type Context = { params: Promise<{ assetId: string }> };

const patchHandler = async (req: NextRequest, { params }: Context) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  try {
    const { assetId } = await params;
    const body = (await req.json()) as { alt?: unknown };
    const item = await updateMediaAssetAlt(
      assetId,
      typeof body.alt === "string" ? body.alt : "",
    );
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
};

const deleteHandler = async (_req: NextRequest, { params }: Context) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  try {
    const { assetId } = await params;
    await deleteMediaAsset(assetId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
};

export const PATCH = withApiAnalytics(
  { route: "/api/admin/media/:assetId", actorType: "admin" },
  patchHandler,
);

export const DELETE = withApiAnalytics(
  {
    route: "/api/admin/media/:assetId",
    actorType: "admin",
    captureRequestBody: false,
  },
  deleteHandler,
);
