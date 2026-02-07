import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import {
  createProjectOrArticle,
  type AdminCollectionName,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const creatable = new Set<AdminCollectionName>(["projects", "articles"]);

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
      { detail: "Only projects or articles can be created" },
      { status: 400 },
    );
  }
  const body = (await req.json()) as Record<string, unknown>;
  const { _id, item } = await createProjectOrArticle(
    collection as Extract<AdminCollectionName, "projects" | "articles">,
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
