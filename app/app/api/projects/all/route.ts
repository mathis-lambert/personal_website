import { NextResponse } from "next/server";

import { getAllProjects } from "@/lib/data/content";

export async function GET() {
  const projects = await getAllProjects();
  return NextResponse.json({ projects });
}
