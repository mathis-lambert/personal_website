import "server-only";
import type { AgentStreamEvent } from "@/types/agent";

export type AgentStreamRunner =
  | (() => AsyncIterable<AgentStreamEvent>)
  | (() => Promise<AsyncIterable<AgentStreamEvent>>);

const encoder = new TextEncoder();

const encodeEvent = (event: string, data: unknown): Uint8Array => {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return encoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
};

export const createAgentStream = (
  run: AgentStreamRunner,
): ReadableStream<Uint8Array> => {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encodeEvent(event, data));
      };

      try {
        const stream = await run();
        for await (const event of stream) {
          send(event.type, event);
        }
        send("done", "[DONE]");
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Agent failed unexpectedly.";
        send("error", { type: "error", error: message });
        send("done", "[DONE]");
        controller.close();
      }
    },
  });
};
