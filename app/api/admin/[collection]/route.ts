import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  createProjectOrNote,
  type AdminCollectionName,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const creatable = new Set<AdminCollectionName>(["projects", "notes"]);

const postHandler = async (
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) => {
  const { collection } = await params;

  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (!creatable.has(collection as AdminCollectionName)) {
    return NextResponse.json(
      { detail: "Only projects or notes can be created" },
      { status: 400 },
    );
  }
  const body = (await req.json()) as Record<string, unknown>;
  const { _id, item } = await createProjectOrNote(
    collection as Extract<AdminCollectionName, "projects" | "notes">,
    body,
  );
  return NextResponse.json({ ok: true, _id, item });
};

export const POST = withApiAnalytics(
  {
    route: "/api/admin/:collection",
    actorType: "admin",
  },
  postHandler,
);
