import type {
  ChatCompletionsChunk,
  ChatCompletionsRequest,
  ChatCompletionsResult,
} from '@/types.ts';

/**
 * Optional callbacks for handling streaming responses.
 */
export interface ApiCallbacks {
  /**
   * Called for each data chunk received from the stream.
   * @param chunk The parsed data chunk.
   */
  onChunk: (chunk: ChatCompletionsChunk) => void;
  /**
   * Called when the stream is fully complete.
   * @param result The final, complete result object.
   */
  onDone?: (result: ChatCompletionsResult) => void;
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
 * that resolves with the full API response.
 * - **Streaming mode:** If an `onChunk` callback is provided, the function will process the
 * response as a stream, invoking the callbacks as data arrives.
 *
 * @param request The chat completion request object.
 * @param options An optional object containing an AbortSignal and/or streaming callbacks.
 * @returns A Promise that resolves with the full result (non-streaming) or void (streaming).
 */
export async function callPersonalApi(
  request: ChatCompletionsRequest,
  options?: {
    signal?: AbortSignal;
    callbacks?: ApiCallbacks;
  },
): Promise<ChatCompletionsResult | void> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { signal, callbacks } = options || {};
  const isStreaming = !!callbacks?.onChunk;

  if (!apiUrl) {
    const error = new Error(
      'API URL is not configured. Please check your environment variables.',
    );
    console.error(`Error: ${error.message}`);
    if (callbacks?.onError) {
      callbacks.onError(error);
    }
    throw error;
  }

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

    // --- Streaming Logic ---
    if (isStreaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // The stream can end without a final 'done' event from the server.
          // The 'done' event handler below is the primary completion signal.
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event fragment

        for (const event of events) {
          if (!event.trim()) continue;

          const dataLine = event
            .split('\n')
            .find((line) => line.startsWith('data:'));
          const eventTypeLine = event
            .split('\n')
            .find((line) => line.startsWith('event:'));

          if (dataLine) {
            const data = dataLine.substring(5).trim();
            try {
              const jsonResponse = JSON.parse(data);
              // Check for the specific 'done' event from the server
              if (eventTypeLine?.includes('done')) {
                if (callbacks.onDone) {
                  callbacks.onDone(jsonResponse as ChatCompletionsResult);
                }
                return; // End the function once the done event is processed
              } else {
                // This is a regular data chunk
                callbacks.onChunk(jsonResponse as ChatCompletionsChunk);
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk data:', data, e);
              // Optionally call onError for parsing errors
            }
          }
        }
      }
      return; // Streaming is finished
    }

    // --- Non-Streaming Logic ---
    const result: ChatCompletionsResult = await response.json();
    return result;
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
