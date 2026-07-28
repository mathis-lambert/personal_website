import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/db/client";

export async function GET() {
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Database ping failed";
    return NextResponse.json(
      {
        status: "degraded",
        db: "unreachable",
        detail,
      },
      { status: 500 },
    );
  }
}
