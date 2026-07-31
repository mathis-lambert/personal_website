import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { requireAdminSession } from "@/lib/auth/helpers";
import {
  archivePublishedContent,
  listContentPublications,
  publishContentDraft,
  rollbackContentPublication,
} from "@/lib/data/publications";
import type { EditorialCollection } from "@/types/editorial";

type Params = {
  collection: string;
  itemId: string;
};

const resolveRequest = async (
  params: Promise<Params>,
): Promise<{ collection: EditorialCollection; itemId: string } | NextResponse> => {
  const { collection, itemId } = await params;
  if (!(await requireAdminSession())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (collection !== "projects" && collection !== "notes") {
    return NextResponse.json({ detail: "Unsupported collection" }, { status: 400 });
  }
  return { collection, itemId };
};

const errorResponse = (error: unknown) =>
  NextResponse.json(
    { detail: error instanceof Error ? error.message : "Publication failed" },
    { status: 400 },
  );

const getHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  const request = await resolveRequest(params);
  if (request instanceof NextResponse) return request;
  try {
    const publications = await listContentPublications(
      request.collection,
      request.itemId,
    );
    return NextResponse.json({ publications });
  } catch (error) {
    return errorResponse(error);
  }
};

const postHandler = async (
  req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  const request = await resolveRequest(params);
  if (request instanceof NextResponse) return request;
  const body = (await req.json().catch(() => ({}))) as {
    sourceVersion?: unknown;
  };
  if (
    body.sourceVersion !== undefined &&
    (!Number.isInteger(body.sourceVersion) || Number(body.sourceVersion) < 1)
  ) {
    return NextResponse.json(
      { detail: "sourceVersion must be a positive integer" },
      { status: 400 },
    );
  }
  try {
    const result =
      typeof body.sourceVersion === "number"
        ? await rollbackContentPublication(
            request.collection,
            request.itemId,
            body.sourceVersion,
          )
        : await publishContentDraft(request.collection, request.itemId);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
};

const deleteHandler = async (
  _req: NextRequest,
  { params }: { params: Promise<Params> },
) => {
  const request = await resolveRequest(params);
  if (request instanceof NextResponse) return request;
  try {
    const item = await archivePublishedContent(
      request.collection,
      request.itemId,
    );
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return errorResponse(error);
  }
};

const analytics = {
  route: "/api/admin/:collection/:itemId/publications",
  actorType: "admin" as const,
};

export const GET = withApiAnalytics(
  { ...analytics, captureRequestBody: false },
  getHandler,
);
export const POST = withApiAnalytics(analytics, postHandler);
export const DELETE = withApiAnalytics(
  { ...analytics, captureRequestBody: false },
  deleteHandler,
);
