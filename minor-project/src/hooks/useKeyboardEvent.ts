import { useEffect } from "react";

interface UseKeyboardEventProps {
  key: string;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  targetWindow?: Window;
}

export function useKeyboardEvent({
  key,
  onKeyDown,
  onKeyUp,
  targetWindow,
}: UseKeyboardEventProps) {
  useEffect(() => {
    const win = targetWindow || window;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key || event.code === key) {
        event.preventDefault();
        onKeyDown?.(event);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === key || event.code === key) {
        event.preventDefault();
        onKeyUp?.(event);
      }
    };
    win.addEventListener("keydown", handleKeyDown);
    win.addEventListener("keyup", handleKeyUp);
    return () => {
      win.removeEventListener("keydown", handleKeyDown);
      win.removeEventListener("keyup", handleKeyUp);
    };
  }, [key, onKeyDown, onKeyUp, targetWindow]);
}
