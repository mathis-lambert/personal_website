import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import {
  deleteConversation,
  getConversationDetail,
} from "@/lib/data/conversations";

type Params = {
  conversationId: string;
};

const getHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const data = await getConversationDetail(conversationId);
  if (!data.item) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
};

const deleteHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  await deleteConversation(conversationId);
  return NextResponse.json({ ok: true });
};

export const GET = withApiAnalytics(
  {
    route: "/api/admin/analytics/conversations/:conversationId",
    actorType: "admin",
    captureRequestBody: false,
  },
  getHandler,
);

export const DELETE = withApiAnalytics(
  {
    route: "/api/admin/analytics/conversations/:conversationId",
    actorType: "admin",
    captureRequestBody: false,
  },
  deleteHandler,
);
