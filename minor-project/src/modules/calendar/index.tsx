import * as React from "react";
import CalendlyWidget from "./CalendlyWidget";
import RevenueHeroWidget from "./RevenueHeroWidget";

// TODO: Replace with PostHog feature flag `calendar-provider` once ready.
// Set to "revenue-hero" to test, "calendly" to revert.
const CALENDAR_PROVIDER_MOCK: "calendly" | "revenue-hero" = "revenue-hero";

/**
 * Calendar module orchestrator.
 *
 * Switches between calendar providers. Currently uses a compile-time mock.
 * Replace CALENDAR_PROVIDER_MOCK with useFeatureFlagVariantKey("calendar-provider")
 * from posthog-js/react when the flag is configured in PostHog.
 */
const Calendar = () => {
  if (CALENDAR_PROVIDER_MOCK === "revenue-hero") {
    return <RevenueHeroWidget />;
  }

  return <CalendlyWidget />;
};

export default React.memo(Calendar);
