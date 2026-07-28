import type { NextRequest } from "next/server";

import { getApiRequestLogsCollection } from "@/lib/db/collections";

import { buildActorContext } from "./context";
import { parseAndRedactBody, redactHeaders, searchParamsToObject } from "./redaction";

type SupportedMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RouteContext = { params?: unknown } | undefined;

export type ApiRouteHandler<TContext extends RouteContext = RouteContext> = (
  req: NextRequest,
  ctx: TContext,
) => Promise<Response>;

export type ApiAnalyticsConfig = {
  route: string;
  actorType?: "public" | "admin" | "system";
  captureRequestBody?: boolean;
};

const readBodyForLog = async (req: NextRequest): Promise<unknown> => {
  const method = req.method.toUpperCase() as SupportedMethod;
  if (method === "GET" || method === "DELETE") {
    return undefined;
  }

  try {
    const cloned = req.clone();
    const contentType = cloned.headers.get("content-type");
    const rawBody = await cloned.text();
    return parseAndRedactBody(rawBody, contentType);
  } catch {
    return "[UNREADABLE_BODY]";
  }
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
};

const persistApiLog = async (payload: {
  req: NextRequest;
  route: string;
  actorType?: "public" | "admin" | "system";
  requestBody: unknown;
  status: number;
  durationMs: number;
  error?: unknown;
}) => {
  try {
    const collection = await getApiRequestLogsCollection();
    const requestContentType = payload.req.headers.get("content-type") || undefined;
    await collection.insertOne({
      kind: "api_request",
      timestamp: new Date(),
      route: payload.route,
      path: payload.req.nextUrl.pathname,
      method: payload.req.method.toUpperCase(),
      status: payload.status,
      ok: payload.status < 400,
      durationMs: payload.durationMs,
      query: searchParamsToObject(payload.req.nextUrl.searchParams),
      actor: buildActorContext(payload.req, payload.actorType),
      request: {
        contentType: requestContentType,
        headers: redactHeaders(payload.req.headers),
        body: payload.requestBody,
      },
      error: payload.error ? normalizeError(payload.error) : undefined,
    });
  } catch (loggingError) {
    console.error("Failed to persist API analytics log", loggingError);
  }
};

export const withApiAnalytics = <TContext extends RouteContext = RouteContext>(
  config: ApiAnalyticsConfig,
  handler: ApiRouteHandler<TContext>,
): ApiRouteHandler<TContext> => {
  return async (req, ctx) => {
    const started = Date.now();
    const shouldCaptureBody = config.captureRequestBody ?? true;
    const requestBody = shouldCaptureBody ? await readBodyForLog(req) : undefined;

    try {
      const response = await handler(req, ctx);
      await persistApiLog({
        req,
        route: config.route,
        actorType: config.actorType,
        requestBody,
        status: response.status,
        durationMs: Date.now() - started,
      });
      return response;
    } catch (error) {
      await persistApiLog({
        req,
        route: config.route,
        actorType: config.actorType,
        requestBody,
        status: 500,
        durationMs: Date.now() - started,
        error,
      });
      throw error;
    }
  };
};
