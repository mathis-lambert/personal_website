import { NextResponse } from "next/server";

import { getAllArticles } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";

export async function GET() {
  const articles = await getAllArticles();
  await logEvent("get_all_articles", {});
  return NextResponse.json({ articles });
}
