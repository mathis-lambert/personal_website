import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import { listConversationTurns } from "@/lib/data/conversations";
import { parsePositiveInt } from "@/lib/analytics/adminQuery";

type Params = {
  conversationId: string;
};

const getHandler = async (
  req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const data = await listConversationTurns({
    conversationId,
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    limit: parsePositiveInt(req, "limit"),
    skip: parsePositiveInt(req, "skip"),
  });

  return NextResponse.json(data);
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/conversations/:conversationId/turns",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);
