import { NextResponse, type NextRequest } from "next/server";

import {
  deleteItem,
  listCollections,
  updateItem,
  type AdminCollectionName,
  type AdminListCollectionName,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const isValidCollection = (name: string): name is AdminCollectionName =>
  listCollections().includes(name as AdminCollectionName);

type AdminParams = {
  collection: string;
  itemId: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<AdminParams> },
) {
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
  const patch = await req.json();
  try {
    const item = await updateItem(
      collection,
      itemId,
      patch,
    );
    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<AdminParams> },
) {
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
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Delete failed" },
      { status: 400 },
    );
  }
}
