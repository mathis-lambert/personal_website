import type {
  AgentRequest,
  AgentResponse,
  AgentStreamEvent,
} from "@/types/agent";

export type AgentCallbacks = {
  onDelta?: (delta: string) => void;
  onFinal?: (response: AgentResponse) => void;
  onError?: (error: Error) => void;
  onEvent?: (event: AgentStreamEvent) => void;
};

const parseErrorDetails = async (res: Response): Promise<string> => {
  try {
    const json = await res.json();
    return JSON.stringify(json);
  } catch {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
};

export async function callAgentApi(
  request: AgentRequest,
  options?: {
    signal?: AbortSignal;
    callbacks?: AgentCallbacks;
  },
): Promise<AgentResponse | void> {
  const { signal, callbacks } = options || {};
  const isStreaming =
    !!callbacks?.onDelta || !!callbacks?.onEvent || !!callbacks?.onFinal;

  const response = await fetch(`/api/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: isStreaming ? "text/event-stream" : "application/json",
    },
    body: JSON.stringify({
      ...request,
      stream: isStreaming,
    }),
    signal,
  });

  if (!response.ok) {
    const details = await parseErrorDetails(response);
    throw new Error(
      `Agent API request failed (${response.status}). ${details}`.trim(),
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (
    isStreaming &&
    contentType.includes("text/event-stream") &&
    response.body
  ) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        if (!event.trim()) continue;

        const lines = event.split("\n");
        let eventName = "message";
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        const data = dataLines.join("\n").trim();
        if (!data) continue;

        if (data === "[DONE]" || eventName === "done") {
          return;
        }

        let payload: AgentStreamEvent | null = null;
        try {
          payload = JSON.parse(data) as AgentStreamEvent;
        } catch (err) {
          callbacks?.onError?.(
            err instanceof Error
              ? err
              : new Error("Failed to parse SSE payload."),
          );
          continue;
        }

        callbacks?.onEvent?.(payload);

        if (eventName === "delta" || payload.type === "delta") {
          callbacks?.onDelta?.(payload.type === "delta" ? payload.delta : "");
          continue;
        }

        if (eventName === "final" || payload.type === "final") {
          if (payload.type === "final") {
            callbacks?.onFinal?.(payload.response);
          }
          continue;
        }

        if (eventName === "error" || payload.type === "error") {
          if (payload.type === "error") {
            callbacks?.onError?.(new Error(payload.error));
          } else {
            callbacks?.onError?.(new Error("Agent stream error."));
          }
        }
      }
    }

    return;
  }

  const json = (await response.json()) as AgentResponse;
  return json;
}
