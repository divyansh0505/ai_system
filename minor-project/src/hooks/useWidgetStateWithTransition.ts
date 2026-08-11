import { useCallback } from "react";
import { useWidgetStore, WidgetState } from "@/store/widgetStore";

/**
 * Hook that wraps setWidgetState
 * View Transitions removed in favor of Framer Motion for better iframe compatibility
 * Framer Motion uses FLIP animations that don't interfere with iframe rendering
 */
export function useWidgetStateWithTransition() {
  const setWidgetState = useWidgetStore((state) => state.setWidgetState);

  const setWidgetStateWithTransition = useCallback(
    (newState: WidgetState) => {
      // Direct state update - Framer Motion handles the animation
      setWidgetState(newState);
    },
    [setWidgetState],
  );

  return setWidgetStateWithTransition;
}
