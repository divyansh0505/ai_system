import { useEffect, useReducer, useRef } from "react";

interface HintState {
  showHint: boolean;
  hasShownInitialHint: boolean;
}

type HintAction =
  | { type: "SHOW_HINT" }
  | { type: "HIDE_HINT" }
  | { type: "MARK_INITIAL_SHOWN" };

function hintReducer(state: HintState, action: HintAction): HintState {
  switch (action.type) {
    case "SHOW_HINT":
      return { ...state, showHint: true };
    case "HIDE_HINT":
      return { ...state, showHint: false };
    case "MARK_INITIAL_SHOWN":
      return { ...state, hasShownInitialHint: true };
    default:
      return state;
  }
}

const initialState: HintState = {
  showHint: false,
  hasShownInitialHint: false,
};

export interface UseUnmuteHintOptions {
  /** Whether microphone is currently enabled */
  micEnabled: boolean;
  /** Current agent state (e.g., "speaking", "listening") */
  agentState: string;
  /** Duration to show initial hint on mount (ms) */
  initialHintDuration?: number;
  /** Duration to show hint after transitions (ms) */
  transitionHintDuration?: number;
  /** Delay before showing hint after auto-mute (ms) */
  autoMuteHintDelay?: number;
}

export function useUnmuteHint(options: UseUnmuteHintOptions) {
  const {
    micEnabled,
    agentState,
    initialHintDuration = 4000,
    transitionHintDuration = 3000,
    autoMuteHintDelay = 500,
  } = options;

  const [state, dispatch] = useReducer(hintReducer, initialState);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevStateRef = useRef(agentState);

  // Helper to show hint with auto-hide
  const showHintTemporarily = (duration: number) => {
    dispatch({ type: "SHOW_HINT" });

    // Clear existing timeout
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }

    // Auto-hide after duration
    hintTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "HIDE_HINT" });
      hintTimeoutRef.current = null;
    }, duration);
  };

  // Trigger hint manually (for external events like auto-mute)
  const triggerHint = (
    delay = autoMuteHintDelay,
    duration = transitionHintDuration
  ) => {
    setTimeout(() => {
      showHintTemporarily(duration);
    }, delay);
  };

  // Show hint on first load if mic is muted
  useEffect(() => {
    if (!state.hasShownInitialHint && !micEnabled) {
      dispatch({ type: "MARK_INITIAL_SHOWN" });
      showHintTemporarily(initialHintDuration);
    }
  }, [micEnabled, state.hasShownInitialHint, initialHintDuration]);

  // Handle agent state transitions
  useEffect(() => {
    const prevState = prevStateRef.current;

    // Detect transition from "speaking" to "listening" (agent finished)
    if (prevState === "speaking" && agentState === "listening") {
      if (!micEnabled) {
        showHintTemporarily(transitionHintDuration);
      }
    }

    prevStateRef.current = agentState;
  }, [agentState, micEnabled, transitionHintDuration]);

  // Hide hint immediately when user unmutes
  useEffect(() => {
    if (micEnabled && state.showHint) {
      dispatch({ type: "HIDE_HINT" });
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
    }
  }, [micEnabled, state.showHint]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  return {
    showHint: state.showHint,
    triggerHint,
  };
}
