import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { buildActorContext } from "@/lib/analytics/context";
import { withApiAnalytics } from "@/lib/analytics/server";
import { trackUiEvent } from "@/lib/data/analytics";

const UI_EVENT_NAMES = [
  "page_view",
  "chat_open",
  "chat_close",
  "chat_submit",
  "project_open",
  "project_external_open",
  "article_open",
  "article_share",
  "resume_export_click",
] as const;

const payloadSchema = z.object({
  name: z.enum(UI_EVENT_NAMES),
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  sessionId: z.string().max(128).optional(),
  timestamp: z.string().datetime().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const postHandler = async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "Invalid analytics payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const actorType = parsed.data.path?.startsWith("/admin") ? "admin" : "public";
  const actor = buildActorContext(req, actorType);
  await trackUiEvent({
    ...parsed.data,
    actor: {
      ...actor,
      type: actorType,
    },
  });

  return NextResponse.json({ ok: true });
};

export const POST = withApiAnalytics(
  {
    route: "/api/analytics/track",
  },
  postHandler,
);
