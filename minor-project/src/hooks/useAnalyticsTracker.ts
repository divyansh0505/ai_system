import { useEffect, useRef } from "react";

/**
 * Hook for tracking events only on changes (skips initial mount)
 * Useful when you don't want to track the initial state
 *
 * @example
 * useChangeTracker(
 *   isVisible,
 *   (value) => analytics.trackVisibilityChange(value)
 * );
 */
export function useChangeTracker<T>(
  value: T,
  callback: (value: T) => void,
): void {
  const isFirstRender = useRef(true);
  const previousValueRef = useRef<T>(value);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (previousValueRef.current !== value) {
      callbackRef.current(value);
      previousValueRef.current = value;
    }
  }, [value]);
}
