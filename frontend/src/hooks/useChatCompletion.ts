import { useEffect, useReducer, useRef } from 'react';
import type { ChatAction, ChatCompletionsRequest, ChatState } from '@/types.ts';
import { callPersonalApi } from '@/api/personalApi.ts';
import useAuth from '@/hooks/useAuth';

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
  const { token } = useAuth();

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
      const controller = new AbortController();
      controllerRef.current = controller;

      await callPersonalApi(request, {
        token,
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
