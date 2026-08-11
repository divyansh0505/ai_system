import ReactDOM from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import App from "./App";
import { ThemeProvider } from "@emotion/react";
import { theme } from "./styles/theme";
import { PostHogProvider } from "posthog-js/react";

import type { LauncherType } from "@/modules/launchers/types";

const VALID_LAUNCHER_TYPES: readonly string[] = [
  "inline",
  "bottom",
  "pitch",
  "modal",
  "direct",
];

/**
 * Detect launcher type with browser URL taking priority over script URL.
 * Priority: window.location.search > import.meta.url > null
 */
function getLauncherType(): LauncherType {
  if (typeof window === "undefined") return null;

  try {
    // Browser URL has highest priority (allows overriding script URL)
    const browserParams = new URLSearchParams(window.location.search);
    const browserLauncher = browserParams.get("launcher");

    if (browserLauncher && VALID_LAUNCHER_TYPES.includes(browserLauncher)) {
      return browserLauncher as LauncherType;
    }

    // Fall back to script URL (import.meta.url)
    const url = new URL(import.meta.url);
    const launcherParam = url.searchParams.get("launcher");

    if (launcherParam && VALID_LAUNCHER_TYPES.includes(launcherParam)) {
      return launcherParam as LauncherType;
    }

    // Backward compatibility: support old "banner" param from script URL
    const bannerParam = url.searchParams.get("banner");

    if (bannerParam === "component") {
      return "inline";
    }

    if (bannerParam === "bottom" || bannerParam === "pitch") {
      return bannerParam;
    }

    return null;
  } catch (error) {
    console.warn("Error detecting launcher type:", error);
    return null;
  }
}

/**
 * Apply inline styles to the bottom launcher container with !important flags
 * This ensures the container is visible even if customer websites have conflicting styles
 * Inline styles with !important have the highest specificity and cannot be overridden
 * Note:
 * - Mobile/tablet hiding is handled by the component using useDeviceDetection hook
 * - Iframe styles are handled by BottomBannerFrame styled component
 */
function applyBottomLauncherStyles(container: HTMLElement): void {
  // Using setProperty with 'important' flag ensures maximum specificity
  // This beats any customer CSS, even with !important
  container.style.setProperty("display", "block", "important");
  container.style.setProperty("visibility", "visible", "important");
  container.style.setProperty("opacity", "1", "important");
  container.style.setProperty("position", "fixed", "important");
  container.style.setProperty("bottom", "0", "important");
  container.style.setProperty("left", "0", "important");
  container.style.setProperty("width", "100%", "important");
  container.style.setProperty("z-index", "99999", "important");
}

/**
 * Get or create container for the widget
 * - For bottom/pitch/modal launcher: creates #interactnow-bottom-launcher at end of body
 * - For inline launcher: uses existing #interactnow-inline-widget
 */
function getOrCreateContainer(launcherType: LauncherType): HTMLElement | null {
  if (
    launcherType === "pitch" ||
    launcherType === "bottom" ||
    launcherType === "modal" ||
    launcherType === "direct"
  ) {
    let container = document.getElementById("interactnow-bottom-launcher");

    if (!container) {
      container = document.createElement("div");
      container.id = "interactnow-bottom-launcher";

      // Apply inline styles with !important to ensure visibility
      applyBottomLauncherStyles(container);

      document.body.appendChild(container);
    } else {
      // Apply styles even if container already exists (in case it was modified)
      applyBottomLauncherStyles(container);
    }

    return container;
  }

  // Inline launcher: use existing inline widget
  const container = document.getElementById("interactnow-inline-widget");

  if (!container && launcherType === "inline") {
    console.warn(
      "Interactnow Widget: #interactnow-inline-widget not found. Add a div with id='interactnow-inline-widget' to your HTML.",
    );
    return null;
  }

  return container;
}

export function initInteractnowWidget() {
  const launcherType = getLauncherType();
  const container = getOrCreateContainer(launcherType);

  if (!container) {
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            defaults: "2025-05-24",
            capture_exceptions: true,
            session_recording: {
              recordCrossOriginIframes: true,
            },
          }}
        >
          <App launcherType={launcherType} />
        </PostHogProvider>
      </ThemeProvider>
    </ErrorBoundary>,
  );
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      initInteractnowWidget(),
    );
  } else {
    initInteractnowWidget();
  }
}

export default initInteractnowWidget;
