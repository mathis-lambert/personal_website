import { NextResponse } from "next/server";

import { getExperiences } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

export async function GET() {
  const experiences = await getExperiences();
  await logEvent("get_all_experiences", {});
  return NextResponse.json({ experiences });
}
