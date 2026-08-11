import { useState, useEffect, useRef } from "react";

interface UseTypingEffectProps {
  text?: string;
  enabled?: boolean;
  speed?: number; // milliseconds per character
}

/**
 * Hook that animates text character by character
 * Appends new characters instead of restarting from scratch
 * @param text - The text to animate
 * @param enabled - Whether the animation should run
 * @param speed - Milliseconds per character (default: 40ms)
 * @returns The current animated text
 */
export function useTypingEffect({
  text = "",
  enabled = true,
  speed = 40,
}: UseTypingEffectProps): string {
  const [displayText, setDisplayText] = useState("");
  const displayTextRef = useRef("");
  const textLengthRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If animation is disabled, show full text
    if (!enabled) {
      setDisplayText(text);
      displayTextRef.current = text;
      textLengthRef.current = text.length;
      return;
    }

    // If text is empty, clear display text
    if (!text) {
      setDisplayText("");
      displayTextRef.current = "";
      textLengthRef.current = 0;
      return;
    }

    // If text hasn't changed in length, no need to animate
    if (text.length === textLengthRef.current) {
      return;
    }

    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Capture the starting position before the interval
    const startIndex = textLengthRef.current;
    const targetLength = text.length;
    let currentIndex = startIndex;

    intervalRef.current = setInterval(() => {
      currentIndex += 1;
      displayTextRef.current = text.substring(0, currentIndex);
      setDisplayText(text.substring(0, currentIndex));

      // When animation completes
      if (currentIndex === targetLength) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, speed);

    // Update the tracked length immediately when text changes
    // This allows the next text update to continue from this length
    textLengthRef.current = targetLength;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, enabled, speed]);

  return displayText;
}
