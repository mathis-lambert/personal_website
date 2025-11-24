import { NextResponse, type NextRequest } from "next/server";

import { getProjectBySlug } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json(
      { detail: "Project not found" },
      { status: 404 },
    );
  }
  await logEvent("get_project_by_slug", { slug });
  return NextResponse.json({ project });
}
