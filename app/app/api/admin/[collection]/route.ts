import { NextResponse, type NextRequest } from "next/server";

import {
  createProjectOrArticle,
  type AdminCollectionName,
} from "@/lib/data/content";
import { requireAdminSession } from "@/lib/auth/helpers";

const creatable = new Set<AdminCollectionName>(["projects", "articles"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
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
  const body = await req.json();
  const { id, item } = await createProjectOrArticle(
    collection as Extract<AdminCollectionName, "projects" | "articles">,
    body,
  );
  return NextResponse.json({ ok: true, id, item });
}
