import { useState, useEffect, useRef } from "react";
import { sessionService } from "../services/session.service";

const PREFETCH_LEAD_MS = 5_000;
const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 8_000;

/**
 * Manages the rotating-QR lifecycle for an active session.
 *
 * State machine:
 *   initial-fetch → display token → prefetch next 5s before expiry → swap at expiry → repeat
 *
 * Recovery:
 *   - Fetch failure: exponential backoff (1s → 8s cap) until a token lands
 *   - Tab hidden: timers paused, in-flight request aborted
 *   - Tab visible: re-initialize from scratch
 */
export const useRotatingQrToken = (sessionId) => {
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    let disposed = false;
    const timers = new Set();
    let abortController = null;
    let nextToken = null;
    let retryDelay = INITIAL_RETRY_MS;

    const addTimer = (fn, delay) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!disposed) fn();
      }, Math.max(0, delay));
      timers.add(id);
      return id;
    };

    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };

    const fetchToken = async () => {
      abortController?.abort();
      abortController = new AbortController();
      try {
        const data = await sessionService.getQrToken(sessionId, {
          signal: abortController.signal,
        });
        if (disposed) return null;
        retryDelay = INITIAL_RETRY_MS;
        return data;
      } catch (err) {
        if (disposed || abortController.signal.aborted) return null;
        setError(err);
        return null;
      }
    };

    const schedulePrefetch = (data) => {
      const lead = data.expiresAt - Date.now() - PREFETCH_LEAD_MS;
      addTimer(async () => {
        const next = await fetchToken();
        if (next) nextToken = next;
      }, lead);
    };

    const scheduleSwap = (data) => {
      const delay = data.expiresAt - Date.now();
      addTimer(() => {
        if (nextToken) {
          const queued = nextToken;
          nextToken = null;
          setCurrent(queued);
          setError(null);
          schedulePrefetch(queued);
          scheduleSwap(queued);
        } else {
          // Prefetch didn't complete — grace window buys us up to 10s more
          fetchAndStart();
        }
      }, delay);
    };

    const fetchAndStart = async () => {
      const data = await fetchToken();
      if (!data) {
        if (disposed) return;
        const delay = retryDelay;
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
        addTimer(fetchAndStart, delay);
        return;
      }
      setCurrent(data);
      setError(null);
      schedulePrefetch(data);
      scheduleSwap(data);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        clearTimers();
        abortController?.abort();
        nextToken = null;
        retryDelay = INITIAL_RETRY_MS;
        fetchAndStart();
      } else {
        clearTimers();
        abortController?.abort();
      }
    };

    fetchAndStart();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      clearTimers();
      abortController?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sessionId]);

  return { current, error };
};
