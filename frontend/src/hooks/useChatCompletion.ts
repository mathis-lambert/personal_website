import { useEffect, useRef, useReducer } from 'react';

// --- Interfaces (assuming these are defined elsewhere or keep them here) ---

export interface ChatCompletionsRequest {
  input: string;
  history: Message[];
}

export interface Message {
  role: string;
  content: string;
}

interface ChatCompletionsChunk {
  chunk: string;
  finish_reason: string | null;
  job_id: string;
}

interface ChatCompletionsResult {
  result: string;
  finish_reason: string;
  job_id: string;
}

// --- State and Action Types for Reducer ---

interface ChatState {
  result: string;
  finishReason: string | null;
  jobId: string | null;
  isLoading: boolean;
  error: Error | null;
}

type ChatAction =
  | { type: 'FETCH_START' }
  | { type: 'STREAM_CHUNK'; payload: ChatCompletionsChunk }
  | { type: 'STREAM_DONE'; payload: ChatCompletionsResult }
  | { type: 'FETCH_SUCCESS'; payload: ChatCompletionsResult }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'RESET' };

// --- Initial State ---

const initialState: ChatState = {
  result: '',
  finishReason: null,
  jobId: null,
  isLoading: false,
  error: null,
};

// --- Reducer Function ---
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...initialState,
        isLoading: true,
      };
    case 'STREAM_CHUNK':
      return {
        ...state,
        // Append chunk to result, update jobId if present
        result: state.result + action.payload.chunk,
        jobId: action.payload.job_id ?? state.jobId,
        finishReason: null,
        isLoading: true,
        error: null,
      };
    case 'STREAM_DONE':
      return {
        ...state,
        finishReason: action.payload.finish_reason,
        jobId: action.payload.job_id ?? state.jobId,
        isLoading: false,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        result: action.payload.result,
        finishReason: action.payload.finish_reason,
        jobId: action.payload.job_id,
        isLoading: false,
        error: null,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// --- Hook ---
const useChatCompletion = (
  request: ChatCompletionsRequest | null, // Allow null request to disable
  isActive: boolean,
): ChatState => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const controllerRef = useRef<AbortController | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Memoize the relevant parts of the request for the dependency array
  const requestDependencies = request
    ? JSON.stringify({
        input: request.input,
        history: request.history,
      })
    : null;

  useEffect(() => {
    if (!isActive || !request || !request.input.trim() || !apiUrl) {
      if (state.isLoading || state.result || state.error) {
        dispatch({ type: 'RESET' });
      }
      return;
    }

    // Abort previous request if a new one starts
    controllerRef.current?.abort();

    // Create a new AbortController for the current request
    const controller = new AbortController();
    controllerRef.current = controller;

    const fetchData = async () => {
      dispatch({ type: 'FETCH_START' });

      try {
        const response = await fetch(`${apiUrl}/api/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(request), // Send the full request object
          signal: controller.signal,
        });

        if (!response.ok) {
          // Try to read error details from the response body
          let errorBody = `HTTP error! Status: ${response.status}`;
          try {
            const errorJson = await response.json();
            errorBody += ` - ${JSON.stringify(errorJson)}`;
          } catch {
            // Ignore if response body is not JSON
          }
          throw new Error(errorBody);
        }

        // --- Streaming Logic (Server-Sent Events) ---
        if (!response.body) {
          throw new Error('ReadableStream not available for streaming.');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let doneReading = false;

        while (!doneReading) {
          // Check for abort signal between reads
          if (controller.signal.aborted) {
            console.log('Fetch aborted by signal.');
            // Ensure reader is released if possible, though abort should handle it
            reader.releaseLock();
            // No error dispatch here, AbortError is caught below
            return;
          }

          const { done, value } = await reader.read();
          if (done) {
            doneReading = true;
            // Process any remaining buffer content if necessary
            // Often, the 'done' event from the server handles the final state
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process buffer line by line or event by event
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event fragment

          for (const event of events) {
            if (!event.trim()) continue;

            const lines = event.split('\n');
            const eventTypeLine = lines.find((line) =>
              line.startsWith('event:'),
            );
            const dataLine = lines.find((line) => line.startsWith('data:'));

            if (dataLine) {
              const data = dataLine.substring(5).trim();
              try {
                const jsonResponse = JSON.parse(data);

                if (eventTypeLine?.includes('done')) {
                  // Assuming 'done' event or final chunk contains the full result structure
                  // Or at least the final finish_reason and potentially jobId
                  // Adjust based on your actual API response for the final event
                  console.log(
                    'Dispatching STREAM_DONE or FETCH_SUCCESS for final event:',
                    jsonResponse,
                  );
                  // If the final event structure matches ChatCompletionsResult:
                  dispatch({
                    type: 'FETCH_SUCCESS',
                    payload: jsonResponse as ChatCompletionsResult,
                  });
                  // Or if it only signals completion:
                  // dispatch({ type: 'STREAM_DONE', payload: jsonResponse });
                  doneReading = true; // Stop reading after processing the final event
                  break; // Exit inner loop once done event is processed
                } else {
                  // Process regular chunk
                  dispatch({
                    type: 'STREAM_CHUNK',
                    payload: jsonResponse as ChatCompletionsChunk,
                  });
                }
              } catch (e) {
                console.error('Failed to parse SSE chunk data:', data, e);
                // Decide if this error should stop the process or just be logged
                // dispatch({ type: 'FETCH_ERROR', payload: new Error('Failed to parse stream data') });
                // doneReading = true; // Option: Stop reading on parse error
                // break;
              }
            }
          }
        }
        // Final check: If loop finished without a 'done' event setting isLoading to false
        // This might indicate an incomplete stream or API inconsistency.
        // Check state after loop if needed. If state.isLoading is still true, handle it.
        // This part depends heavily on how the stream *always* terminates.
        // If the server guarantees a final message or event that triggers FETCH_SUCCESS/STREAM_DONE,
        // this manual check might not be needed.
      } catch (error) {
        // Only dispatch error if it's not an AbortError
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          dispatch({ type: 'FETCH_ERROR', payload: error });
        } else if (error instanceof Error && error.name === 'AbortError') {
          console.log('Fetch aborted successfully.');
          // Optionally dispatch a specific 'ABORTED' action if needed by UI
          // dispatch({ type: 'RESET' }); // Or reset state on abort
        }
      } finally {
        // Ensure isLoading is false if fetch ends unexpectedly without success/error dispatch
        // Note: This might be tricky with streaming. Reducer should handle final state.
        // Check state here if necessary:
        // if (state.isLoading && !controller.signal.aborted) {
        //    dispatch({ type: 'FETCH_ERROR', payload: new Error('Fetch ended unexpectedly') });
        // }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      console.log('Cleaning up effect: Aborting fetch controller.');
      controller.abort();
      controllerRef.current = null; // Clear the ref
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestDependencies, isActive, apiUrl]); // Dependencies

  return state; // Return the state object { result, finishReason, jobId, isLoading, error }
};

export default useChatCompletion;
