import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  getCollection,
  listCollections,
  replaceCollection,
  type AdminCollectionName,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const isValidCollection = (name: string): name is AdminCollectionName =>
  listCollections().includes(name as AdminCollectionName);

const getHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) => {
  const { collection } = await params;

  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ detail: "Unknown collection" }, { status: 400 });
  }
  const data = await getCollection(collection);
  return NextResponse.json({ collection, data });
};

const putHandler = async (
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) => {
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
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/data/:collection",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);

export const PUT = withApiAnalytics(
  {
    route: "/api/admin/data/:collection",
    actorType: "admin",
  },
  putHandler,
);
