"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Loading data into an admin screen.
 *
 * `loading` is derived, never stored: the state carries the request that
 * produced it, so a new request object means what is on screen is stale. That
 * removes the setState-in-effect the hand-rolled loaders all tripped over, and
 * the flag cannot drift from the request in flight.
 *
 * The fetch starts through `Promise.resolve().then(...)` so the first state
 * update always lands in a later microtask, whatever the loader does before its
 * own first await.
 */
type State<T> = {
  request: object | null;
  data: T | null;
  error: string | null;
};

export type AdminData<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Fetch again. Safe to call from an event handler after a mutation. */
  reload: () => void;
  /**
   * Replace what is on screen without a round trip, for when a mutation already
   * returned the updated record.
   */
  set: (update: T | ((current: T | null) => T)) => void;
};

/**
 * @param load Fetches the data, or `null` while the screen is not ready to load
 *   (no token yet, nothing selected). Wrap it in `useMemo` so its identity
 *   changes exactly when the request should be made again.
 */
export function useAdminData<T>(
  load: ((signal: AbortSignal) => Promise<T>) | null,
): AdminData<T> {
  const [state, setState] = useState<State<T>>({
    request: null,
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  const request = useMemo(
    () => (load ? { load, attempt } : null),
    [load, attempt],
  );

  useEffect(() => {
    if (!request) return;

    const controller = new AbortController();
    let cancelled = false;

    void Promise.resolve()
      .then(() => request.load(controller.signal))
      .then(
        (data) => {
          if (!cancelled) setState({ request, data, error: null });
        },
        (error: unknown) => {
          if (cancelled || controller.signal.aborted) return;
          setState({
            request,
            data: null,
            error: (error as Error)?.message || "Failed to load",
          });
        },
      );

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [request]);

  const set = useCallback((update: T | ((current: T | null) => T)) => {
    setState((current) => ({
      ...current,
      data:
        typeof update === "function"
          ? (update as (value: T | null) => T)(current.data)
          : update,
    }));
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: request !== null && state.request !== request,
    reload: useCallback(() => setAttempt((n) => n + 1), []),
    set,
  };
}
