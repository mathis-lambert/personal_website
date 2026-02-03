"use client";
import { useEffect, useReducer, useRef } from "react";
import type { AgentRequest, AgentResponse } from "@/types/agent";
import { callAgentApi } from "@/api/agentClient";

export type AgentState = {
  result: string;
  response: AgentResponse | null;
  isLoading: boolean;
  error: Error | null;
};

type AgentAction =
  | { type: "FETCH_START" }
  | { type: "STREAM_DELTA"; payload: string }
  | { type: "FETCH_SUCCESS"; payload: AgentResponse }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "RESET" };

const initialState: AgentState = {
  result: "",
  response: null,
  isLoading: false,
  error: null,
};

const reducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...initialState, isLoading: true };
    case "STREAM_DELTA":
      return {
        ...state,
        result: state.result + action.payload,
        isLoading: true,
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        response: action.payload,
        result:
          action.payload.message?.content === state.result
            ? state.result
            : (action.payload.message?.content ?? state.result),
        isLoading: false,
        error: null,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const useChatAgent = (
  request: AgentRequest | null,
  isActive: boolean,
): AgentState => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const controllerRef = useRef<AbortController | null>(null);

  const requestSignature = request
    ? JSON.stringify({
        messages: request.messages,
        location: request.location,
      })
    : null;

  useEffect(() => {
    if (!isActive || !request || !request.messages.length) {
      if (state.isLoading || state.result || state.error || state.response) {
        dispatch({ type: "RESET" });
      }
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const run = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const directResponse = await callAgentApi(request, {
          signal: controller.signal,
          callbacks: {
            onDelta: (delta) =>
              dispatch({ type: "STREAM_DELTA", payload: delta }),
            onFinal: (response) =>
              dispatch({ type: "FETCH_SUCCESS", payload: response }),
            onError: (error) =>
              dispatch({ type: "FETCH_ERROR", payload: error }),
          },
        });
        if (directResponse) {
          dispatch({ type: "FETCH_SUCCESS", payload: directResponse });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        dispatch({
          type: "FETCH_ERROR",
          payload: err instanceof Error ? err : new Error("Agent failed."),
        });
      }
    };

    run();

    return () => {
      controller.abort();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestSignature, isActive]);

  return state;
};

export default useChatAgent;
