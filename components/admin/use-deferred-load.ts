"use client";

/**
 * Run an async data fetch after the current render commits, so any setState it
 * performs does not happen synchronously inside a `useEffect` body (which React
 * warns about as cascading renders). Returns a cleanup function that cancels a
 * pending deferred call if the component unmounts first.
 */
export function runAfterRender(fn: () => Promise<void> | void) {
  let cancelled = false;
  const id = setTimeout(() => {
    if (!cancelled) void fn();
  }, 0);
  return () => {
    cancelled = true;
    clearTimeout(id);
  };
}
