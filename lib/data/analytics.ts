import { getUiEventsCollection, type UiEventDocument } from "@/lib/db/collections";
import { redactValue } from "@/lib/analytics/redaction";

/** Recording a UI event. Reading them back is `lib/data/insights.ts`. */
type UiEventInput = {
  name: string;
  path?: string;
  referrer?: string;
  sessionId?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
  actor: UiEventDocument["actor"];
};

export async function trackUiEvent(input: UiEventInput): Promise<void> {
  const collection = await getUiEventsCollection();

  const parsed = input.timestamp ? new Date(input.timestamp) : null;
  const timestamp =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();

  await collection.insertOne({
    kind: "ui_event",
    timestamp,
    name: input.name,
    path: input.path,
    referrer: input.referrer,
    sessionId: input.sessionId,
    actor: input.actor,
    // Properties are visitor-supplied, so they go through redaction before
    // they reach the database.
    properties:
      (redactValue(input.properties ?? {}) as Record<string, unknown>) || {},
  });
}
