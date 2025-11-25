import { NextResponse, type NextRequest } from "next/server";

import {
  getCollection,
  listCollections,
  replaceCollection,
  type AdminCollectionName,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const isValidCollection = (name: string): name is AdminCollectionName =>
  listCollections().includes(name as AdminCollectionName);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;

  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ detail: "Unknown collection" }, { status: 400 });
  }
  const data = await getCollection(collection);
  return NextResponse.json({ collection, data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;

  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ detail: "Unknown collection" }, { status: 400 });
  }
  const payload = await req.json();
  try {
    await replaceCollection(collection, payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Replace failed";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
