import type {
  ApiCompletionResult,
  ApiStreamChunk,
  ChatCompletionsRequest,
  OpenAIChatCompletion,
  FinishReason,
} from '@/types.ts';

/**
 * Optional callbacks for handling streaming responses.
 */
export interface ApiCallbacks {
  /**
   * Called for each data chunk received from the stream.
   * @param chunk The parsed data chunk.
   */
  onChunk: (chunk: ApiStreamChunk) => void;
  /**
   * Called when the stream is fully complete.
   * @param result The final, complete result object.
   */
  onDone?: (result: ApiCompletionResult) => void;
  /**
   * Called if an error occurs during the fetch or streaming.
   * @param error The error object.
   */
  onError?: (error: Error) => void;
}

/**
 * Calls the personal chat completions API, supporting both streaming and non-streaming responses.
 *
 * - **Non-streaming mode (default):** If no callbacks are provided, the function returns a Promise
 *   that resolves with the full API response.
 * - **Streaming mode:** If an `onChunk` callback is provided, the function will process the
 *   response as a stream, invoking the callbacks as data arrives.
 *
 * @param request The chat completion request object.
 * @param options An optional object containing a token, AbortSignal and/or streaming callbacks.
 * @returns A Promise that resolves with the full result (non-streaming) or void (streaming).
 */
export async function callPersonalApi(
  request: ChatCompletionsRequest,
  options?: {
    signal?: AbortSignal;
    callbacks?: ApiCallbacks;
  },
): Promise<ApiCompletionResult | void> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
  const { signal, callbacks } = options || {};
  const isStreaming = !!callbacks?.onChunk;

  try {
    const response = await fetch(`${apiUrl}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Request a stream only if we have a callback to handle it
        Accept: isStreaming ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = ` - ${JSON.stringify(errorJson)}`;
      } catch {
        // Body is not JSON or is empty.
      }
      throw new Error(
        `API request failed with status: ${response.status}${errorDetails}`,
      );
    }

    // --- Streaming Logic (also auto-detect SSE in non-streaming mode) ---
    const contentType = response.headers.get('content-type') || '';
    if (
      (isStreaming || contentType.includes('text/event-stream')) &&
      response.body
    ) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      // Accumulator for both streaming and non-streaming usage
      let aggregatedResult = '';
      let aggregatedReasoning = '';
      let aggregatedReasoningContent = '';
      let aggregatedId: string | null = null;
      let aggregatedFinish: FinishReason | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const text = decoder.decode(value, { stream: true });
        buffer += text;

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.trim()) continue;

          const dataLine = event
            .split('\n')
            .find((line) => line.startsWith('data:'));
          const eventTypeLine = event
            .split('\n')
            .find((line) => line.startsWith('event:'));

          if (!dataLine) continue;
          const data = dataLine.substring(5).trim();
          // Handle SSE sentinel if used
          if (data === '[DONE]') {
            const donePayload: ApiCompletionResult = {
              result: aggregatedResult,
              reasoning: aggregatedReasoning || null,
              reasoning_content: aggregatedReasoningContent || null,
              finish_reason: (aggregatedFinish ?? 'stop') as FinishReason,
              id: aggregatedId ?? '',
            };
            if (callbacks?.onDone) {
              callbacks.onDone(donePayload);
              return;
            }
            return donePayload;
          }
          try {
            const parsed = JSON.parse(data) as unknown;

            const isDoneEvent = !!eventTypeLine?.includes('done');

            if (isDoneEvent) {
              const donePayload: ApiCompletionResult = {
                result: aggregatedResult,
                reasoning: aggregatedReasoning || null,
                reasoning_content: aggregatedReasoningContent || null,
                finish_reason: (aggregatedFinish ?? 'stop') as FinishReason,
                id: aggregatedId ?? '',
              };
              if (callbacks?.onDone) {
                callbacks.onDone(donePayload);
                return; // finish streaming mode
              }
              return donePayload;
            }

            // Normalize possible formats into our simple shapes
            let nextChunk = '';
            let nextReasoning: string | null = null;
            let nextReasoningContent: string | null = null;
            let nextFinish: FinishReason | null = null;
            let nextId: string | null = null;

            // OpenAI-like chunk: object === 'chat.completion.chunk'
            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              'object' in (parsed as Record<string, unknown>) &&
              (parsed as Record<string, unknown>).object ===
                'chat.completion.chunk'
            ) {
              const oai = parsed as {
                id?: string;
                choices?: Array<{
                  delta?: {
                    role?: string | null;
                    content?: string | null;
                    reasoning?: string | null;
                    reasoning_content?: string | null;
                  };
                  finish_reason?: string | null;
                }>;
              };
              const choice = oai.choices?.[0];
              nextChunk = choice?.delta?.content ?? '';
              nextReasoning = choice?.delta?.reasoning ?? null;
              nextReasoningContent = choice?.delta?.reasoning_content ?? null;
              nextFinish = choice?.finish_reason ?? null;
              nextId = oai.id ?? null;
            } else if (
              typeof parsed === 'object' &&
              parsed !== null &&
              'object' in (parsed as Record<string, unknown>) &&
              (parsed as Record<string, unknown>).object === 'chat.completion'
            ) {
              // Non-streaming OpenAI-like completion
              const completion = parsed as OpenAIChatCompletion;
              const message = completion.choices?.[0]?.message?.content ?? '';
              const reason = (completion.choices?.[0]?.finish_reason ??
                'stop') as FinishReason;
              const donePayload: ApiCompletionResult = {
                result: message,
                finish_reason: reason,
                id: completion.id,
              };
              if (callbacks?.onDone) {
                callbacks.onDone(donePayload);
                return;
              }
              return donePayload;
            }

            // Update aggregation
            if (nextChunk) {
              aggregatedResult += nextChunk;
            }
            if (nextReasoning) {
              aggregatedReasoning += nextReasoning;
            }
            if (nextReasoningContent) {
              aggregatedReasoningContent += nextReasoningContent;
            }
            if (nextId) {
              aggregatedId = nextId;
            }
            if (nextFinish !== null) {
              aggregatedFinish = nextFinish;
            }

            // Emit chunk callback as our simplified shape
            if (callbacks?.onChunk) {
              const chunkPayload: ApiStreamChunk = {
                content: nextChunk,
                reasoning: nextReasoning,
                reasoning_content: nextReasoningContent,
                finish_reason: nextFinish,
                id: aggregatedId ?? '',
              };
              callbacks.onChunk(chunkPayload);
            }

            // If backend signals finish via finish_reason inside chunk, end stream
            if (nextFinish !== null) {
              const donePayload: ApiCompletionResult = {
                result: aggregatedResult,
                reasoning: aggregatedReasoning || null,
                reasoning_content: aggregatedReasoningContent || null,
                finish_reason: (aggregatedFinish ?? 'stop') as FinishReason,
                id: aggregatedId ?? '',
              };
              if (callbacks?.onDone) {
                callbacks.onDone(donePayload);
                return;
              }
              return donePayload;
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk data:', data, e);
            // Continue; optionally callbacks?.onError(e as Error)
          }
        }
      }

      // If server didn't send an explicit done event, but we aggregated content, return it
      if (!isStreaming && aggregatedResult) {
        return {
          result: aggregatedResult,
          reasoning: aggregatedReasoning || null,
          reasoning_content: aggregatedReasoningContent || null,
          finish_reason: (aggregatedFinish ?? 'stop') as FinishReason,
          id: aggregatedId ?? '',
        } as ApiCompletionResult;
      }
      return; // Streaming finished with callbacks
    }

    // --- Non-Streaming Logic ---
    const nonStreaming = (await response.json()) as unknown;
    // Convert OpenAI completion to ApiCompletionResult
    if (
      typeof nonStreaming === 'object' &&
      nonStreaming !== null &&
      'object' in (nonStreaming as Record<string, unknown>) &&
      (nonStreaming as Record<string, unknown>).object === 'chat.completion'
    ) {
      const completion = nonStreaming as OpenAIChatCompletion;
      return {
        id: completion.id,
        result: completion.choices?.[0]?.message?.content ?? '',
        finish_reason: (completion.choices?.[0]?.finish_reason ??
          'stop') as FinishReason,
      };
    }
    // Otherwise assume our simplified result (rare)
    const fallback = nonStreaming as {
      result?: string;
      finish_reason?: string;
      id?: string;
    };
    return {
      id: fallback.id ?? '',
      result: fallback.result ?? '',
      finish_reason: (fallback.finish_reason ?? 'stop') as FinishReason,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('API request was aborted.');
      // Don't throw on abort, just return silently.
      return;
    }

    console.error('Error calling Personal API:', error);
    if (callbacks?.onError && error instanceof Error) {
      callbacks.onError(error);
    }
    // For non-streaming, we re-throw to be caught by the caller's try/catch
    if (!isStreaming) {
      throw error;
    }
  }
}
