import { useEffect, useState } from "react";

/**
 * Debounces agent state to avoid frequent state transitions triggering UI updates.
 * Only considers the agent in the target state if it has been in that state for the specified delay.
 * This prevents UI elements from flickering when the state rapidly toggles.
 *
 * @param currentState - The current agent state from useVoiceAssistant
 * @param targetState - The state to wait for (e.g., "listening", "thinking")
 * @param delay - Delay in milliseconds before considering state as stable (default: 500ms)
 * @param resetTrigger - Optional dependency that resets the timer when changed
 * @returns true if the agent has been in the target state for at least `delay` milliseconds
 *
 * @example
 * // For suggestions (wait for listening state)
 * const isStableListening = useStableAgentState(state, "listening", 500);
 *
 * // For thinking indicator (wait for thinking state)
 * const isStableThinking = useStableAgentState(state, "thinking", 300);
 *
 * // With reset trigger (e.g., reset timer when transcript changes)
 * const isStableListening = useStableAgentState(state, "listening", 500, transcript);
 */
export function useStableAgentState(
  currentState: string,
  targetState: string,
  delay: number = 500,
  resetTrigger?: unknown,
): boolean {
  const [isStable, setIsStable] = useState(false);

  useEffect(() => {
    if (currentState === targetState) {
      // Reset to false when resetTrigger changes
      setIsStable(false);

      // Only set to true after the specified delay
      const timer = setTimeout(() => {
        setIsStable(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      // Immediately set to false when state is no longer the target state
      setIsStable(false);
    }
  }, [currentState, targetState, delay, resetTrigger]);

  return isStable;
}
