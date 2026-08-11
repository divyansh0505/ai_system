import { useEffect, useCallback, useState, useRef } from "react";
import { useStore } from "@/store";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

// Minimum time after page load before showing exit intent (in milliseconds)
const MIN_PAGE_TIME_MS = 5 * 1000; // 5 seconds

// Threshold in pixels from top of viewport to detect exit intent
const EXIT_INTENT_THRESHOLD_PX = 10;

interface UseExitIntentOptions {
  enabled?: boolean;
}

/**
 * Hook to detect exit intent and trigger the exit intent modal.
 *
 * Triggers when:
 * - Desktop device only (not mobile/tablet)
 * - Mouse moves toward browser chrome (top of screen, within 10px)
 * - User has spent at least 30 seconds on page
 * - Modal hasn't been shown before (persisted in localStorage)
 * - User hasn't already engaged via integrated launchers
 */
export function useExitIntent(options: UseExitIntentOptions = {}) {
  const { enabled = true } = options;
  const { isDesktop } = useDeviceDetection();
  const exitIntent = useStore((state) => state.exitIntent);
  const openExitIntent = useStore((state) => state.openExitIntent);
  const [pageLoadTime] = useState(() => Date.now());

  // Track if we've already triggered to prevent multiple triggers
  const hasTriggeredRef = useRef(false);

  const shouldTrigger = useCallback(() => {
    // Don't trigger if disabled
    if (!enabled) return false;

    if (!isDesktop) return false;

    if (exitIntent.isOpen) return false;

    if (exitIntent.hasShown) return false;

    if (hasTriggeredRef.current) return false;

    // Don't trigger if less than MIN_PAGE_TIME_MS since page load
    const timeSincePageLoad = Date.now() - pageLoadTime;
    if (timeSincePageLoad < MIN_PAGE_TIME_MS) return false;

    return true;
  }, [
    enabled,
    isDesktop,
    exitIntent.isOpen,
    exitIntent.hasShown,
    pageLoadTime,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use mousemove to detect when mouse approaches top of viewport
    // This triggers before the mouse actually leaves, feeling more responsive
    const handleMouseMove = (e: MouseEvent) => {
      // Trigger when mouse is within threshold of top edge
      if (e.clientY <= EXIT_INTENT_THRESHOLD_PX && shouldTrigger()) {
        hasTriggeredRef.current = true;
        openExitIntent();
      }
    };

    // Also listen for mouseleave as a fallback
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves through top of viewport
      if (e.clientY <= 0 && shouldTrigger()) {
        hasTriggeredRef.current = true;
        openExitIntent();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shouldTrigger, openExitIntent]);

  return {
    isOpen: exitIntent.isOpen,
    hasShown: exitIntent.hasShown,
  };
}
