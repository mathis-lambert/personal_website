import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import {
  archiveContentItem,
  publishContentItem,
} from "@/lib/data/content";

type Params = {
  collection: string;
  itemId: string;
};

const postHandler = async (
  req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  const { collection, itemId } = await params;
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (collection !== "projects" && collection !== "notes") {
    return NextResponse.json({ detail: "Unsupported collection" }, { status: 400 });
  }

  const body = (await req.json()) as { action?: unknown };
  try {
    const item =
      body.action === "publish"
        ? await publishContentItem(collection, itemId)
        : body.action === "archive"
          ? await archiveContentItem(collection, itemId)
          : null;
    if (!item) {
      return NextResponse.json({ detail: "Unsupported action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publication failed";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
};

export const POST = withApiAnalytics(
  {
    route: "/api/admin/:collection/:itemId/publication",
    actorType: "admin",
  },
  postHandler,
);
