import { useEffect, useReducer, useRef } from 'react';
import type { ChatAction, ChatCompletionsRequest, ChatState } from '@/types.ts';
import { callPersonalApi } from '@/api/personalApi.ts';
import useAuth from '@/hooks/useAuth';

// --- Initial State ---

const initialState: ChatState = {
  result: '',
  reasoning: null,
  reasoning_content: null,
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
        // Append delta content to result, update id if present
        result: state.result + action.payload.content,
        reasoning: action.payload.reasoning ?? state.reasoning,
        reasoning_content: action.payload.reasoning_content ?? state.reasoning_content,
        jobId: action.payload.id ?? state.jobId,
        finishReason: null,
        isLoading: true,
        error: null,
      };
    case 'STREAM_DONE':
      return {
        ...state,
        finishReason: action.payload.finish_reason,
        reasoning: action.payload.reasoning ?? state.reasoning,
        reasoning_content: action.payload.reasoning_content ?? state.reasoning_content,
        jobId: action.payload.id ?? state.jobId,
        isLoading: false,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        result: action.payload.result,
        reasoning: action.payload.reasoning ?? state.reasoning,
        reasoning_content: action.payload.reasoning_content ?? state.reasoning_content,
        finishReason: action.payload.finish_reason,
        jobId: action.payload.id,
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
  const { token } = useAuth();

  // Memoize the relevant parts of the request for the dependency array
  const requestDependencies = request
    ? JSON.stringify({
      messages: request.messages,
    })
    : null;

  useEffect(() => {
    if (!isActive || !request || !request.messages.length || !apiUrl) {
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
      const controller = new AbortController();
      controllerRef.current = controller;

      await callPersonalApi(request, {
        token: token ?? undefined,
        signal: controller.signal,
        callbacks: {
          onChunk: (chunk) => {
            dispatch({ type: 'STREAM_CHUNK', payload: chunk });
          },
          onDone: (result) => {
            dispatch({ type: 'FETCH_SUCCESS', payload: result });
          },
          onError: (error) => {
            dispatch({ type: 'FETCH_ERROR', payload: error });
          },
        },
      });
    };

    fetchData();

    // Cleanup function
    return () => {
      console.log('Cleaning up effect: Aborting fetch controller.');
      controller.abort();
      controllerRef.current = null; // Clear the ref
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestDependencies, isActive, apiUrl, token]); // Dependencies

  return state; // Return the state object { result, finishReason, jobId, isLoading, error }
};

export default useChatCompletion;
