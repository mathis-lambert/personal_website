import { NextResponse } from "next/server";

import { getStudies } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

export async function GET() {
  const studies = await getStudies();
  await logEvent("get_all_studies", {});
  return NextResponse.json({ studies });
}
