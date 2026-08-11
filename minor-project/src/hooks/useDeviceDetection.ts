import { useEffect, useState } from "react";
import { MOBILE_BREAKPOINT, TABLET_BREAKPOINT } from "@/utils/constants";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  deviceType: DeviceType;
}

/**
 * Get the minimum screen dimension (portrait width) regardless of orientation.
 * This ensures a phone in landscape is still detected as mobile.
 */
function getMinScreenDimension(): number {
  return Math.min(window.screen.width, window.screen.height);
}

/**
 * Check if touch is the primary input method (not just available).
 * Returns true for phones/tablets, false for laptops with touchscreen.
 */
function isTouchPrimary(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Detect device type based on screen dimensions and touch capability.
 * Uses the minimum screen dimension to correctly identify devices regardless of orientation.
 */
function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";

  const minDimension = getMinScreenDimension();
  const hasTouch = isTouchPrimary();

  // Mobile: touch primary + small screen (portrait width < MOBILE_BREAKPOINT)
  if (hasTouch && minDimension < MOBILE_BREAKPOINT) {
    return "mobile";
  }

  // Tablet: touch primary + medium screen (portrait width < TABLET_BREAKPOINT)
  if (hasTouch && minDimension < TABLET_BREAKPOINT) {
    return "tablet";
  }

  return "desktop";
}

/**
 * Check if device is currently in landscape orientation
 */
function isLandscapeOrientation(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(orientation: landscape)").matches;
}

/**
 * Hook to detect device type based on screen dimensions and touch capability.
 * Uses the minimum screen dimension to correctly identify mobile devices
 * regardless of orientation (a phone in landscape is still detected as mobile).
 * Also provides landscape orientation detection for layout switching.
 */
export function useDeviceDetection(): DeviceDetection {
  const [state, setState] = useState<{
    deviceType: DeviceType;
    isLandscape: boolean;
    isTouchDevice: boolean;
  }>(() => {
    if (typeof window === "undefined") {
      return { deviceType: "desktop", isLandscape: true, isTouchDevice: false };
    }
    return {
      deviceType: detectDeviceType(),
      isLandscape: isLandscapeOrientation(),
      isTouchDevice: isTouchPrimary(),
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const orientationQuery = window.matchMedia("(orientation: landscape)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");

    const updateState = () => {
      setState({
        deviceType: detectDeviceType(),
        isLandscape: isLandscapeOrientation(),
        isTouchDevice: isTouchPrimary(),
      });
    };

    // Listen for orientation changes
    orientationQuery.addEventListener("change", updateState);
    // Listen for pointer type changes (e.g., connecting/disconnecting input devices)
    pointerQuery.addEventListener("change", updateState);

    // Initial check
    updateState();

    return () => {
      orientationQuery.removeEventListener("change", updateState);
      pointerQuery.removeEventListener("change", updateState);
    };
  }, []);

  return {
    isMobile: state.deviceType === "mobile",
    isTablet: state.deviceType === "tablet",
    isDesktop: state.deviceType === "desktop",
    isLandscape: state.isLandscape,
    isTouchDevice: state.isTouchDevice,
    deviceType: state.deviceType,
  };
}
