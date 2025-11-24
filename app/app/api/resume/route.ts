import { NextResponse } from "next/server";

import { getResume } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

export async function GET() {
  const resume = await getResume();
  await logEvent("get_resume", {});
  return NextResponse.json({ resume });
}
