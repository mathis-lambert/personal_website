import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  deleteItem,
  getAdminContentItem,
  listCollections,
  updateItem,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";
import type {
  AdminCollectionName,
  AdminListCollectionName,
} from "@/types/admin";

const isValidCollection = (name: string): name is AdminCollectionName =>
  listCollections().includes(name as AdminCollectionName);

type AdminParams = {
  collection: string;
  itemId: string;
};

const getHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<AdminParams> },
) => {
  const { collection, itemId } = await params;
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (collection !== "projects" && collection !== "notes") {
    return NextResponse.json({ detail: "Unsupported collection" }, { status: 400 });
  }
  const item = await getAdminContentItem(collection, itemId);
  if (!item) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
};

const patchHandler = async (
  req: NextRequest,
  { params }: { params: Promise<AdminParams> },
) => {
  const { collection, itemId } = await params;

  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ detail: "Unknown collection" }, { status: 400 });
  }
  if (collection === "resume") {
    return NextResponse.json(
      { detail: "Use /api/admin/resume for resume updates" },
      { status: 400 },
    );
  }
  const patch = (await req.json()) as Record<string, unknown>;
  try {
    const item = await updateItem(collection, itemId, patch);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
};

const deleteHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<AdminParams> },
) => {
  const { collection, itemId } = await params;

  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ detail: "Unknown collection" }, { status: 400 });
  }
  if (collection === "resume") {
    return NextResponse.json(
      { detail: "Cannot delete resume" },
      { status: 400 },
    );
  }
  try {
    const item = await deleteItem(
      collection as AdminListCollectionName,
      itemId,
    );
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
};

export const PATCH = withApiAnalytics(
  {
    route: "/api/admin/:collection/:itemId",
    actorType: "admin",
  },
  patchHandler,
);

export const GET = withApiAnalytics(
  {
    route: "/api/admin/:collection/:itemId",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);

export const DELETE = withApiAnalytics(
  {
    route: "/api/admin/:collection/:itemId",
    actorType: "admin",
    captureRequestBody: false,
  },
  deleteHandler,
);
