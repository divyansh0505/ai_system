import { useEffect, useRef, useState } from "react";

interface UseScrollingWaveformOptions {
  bars: number[];
  isActive: boolean;
  barCount?: number;
}

/**
 * Custom hook to create a scrolling waveform effect
 * Values shift left through fixed bars, creating a flowing animation
 */
export function useScrollingWaveform({
  bars,
  isActive,
  barCount = 20,
}: UseScrollingWaveformOptions) {
  const [displayBars, setDisplayBars] = useState<number[]>(
    Array(barCount).fill(0)
  );
  const wasActiveRef = useRef(false);

  // Reset bars when transitioning from inactive to active
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setDisplayBars(Array(barCount).fill(0));
    }
    wasActiveRef.current = isActive;
  }, [isActive, barCount]);

  // Shift values left and add new value on right
  useEffect(() => {
    if (!isActive || !bars || bars.length === 0) return;

    setDisplayBars((prev) => {
      // Remove first element, add last bar value at end
      return [...prev.slice(1), bars[bars.length - 1]];
    });
  }, [bars, isActive]);

  return displayBars;
}
