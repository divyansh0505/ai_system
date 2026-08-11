import * as React from "react";
import styled from "@emotion/styled";
import { useConnectionState } from "@livekit/components-react";
import { useChangeTracker } from "@/hooks/useAnalyticsTracker";
import { analytics } from "@/services/analytics";
import { useWidgetStore } from "@/store/widgetStore";
import { useStore } from "@/store";
import { useCtaButtons } from "@/store/sessionStore";
import { resetAllStores } from "@/lib/resetStores";

import Button from "@/components/ui/Button";
import TalkToHumanButton from "@/components/TalkToHumanButton";
import PoweredByBadge from "@/components/PoweredByBadge";
import { PresentationModeControls } from "@/modules/slides";
import { X, ExternalLink } from "lucide-react";

// Desktop-only controls - mobile uses SlidesMobile component with its own controls

const FixedBottomRight = styled.div({
  position: "fixed",
  bottom: "25px",
  right: "25px",
  zIndex: 1000,
});

const TopRightActions = styled.div({
  position: "absolute",
  top: "1.25rem",
  right: "1.25rem",
  display: "flex",
  gap: "0.75rem",
  alignItems: "center",
  zIndex: 1000,
});

const StyledCtaButton = styled.a({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.25rem",
  height: "40px",
  padding: "0 16px 0 0.5rem",
  fontSize: "1.25rem",
  fontWeight: 500,
  color: "#2563eb",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.65) 100%)",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  borderRadius: "12px",
  textDecoration: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  userSelect: "none",
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
  transition: "all 0.2s ease",
  position: "relative",
  overflow: "hidden",
  opacity: 1,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)",
    pointerEvents: "none",
  },
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    opacity: 1,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
  },
  "& svg": {
    width: "16px",
    height: "16px",
    flexShrink: 0,
    margin: "0.5rem",
  },
});

const StyledExitButton = styled(Button)({
  background:
    "linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(220, 38, 38, 0.8) 100%)",
  color: "white",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: "12px",
  paddingLeft: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  boxShadow:
    "0 4px 6px -1px rgba(239, 68, 68, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
  transition: "all 0.2s ease",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)",
    pointerEvents: "none",
  },
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.9) 100%)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    opacity: 1,
    boxShadow:
      "0 10px 15px -3px rgba(239, 68, 68, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)",
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow:
      "0 4px 6px -1px rgba(239, 68, 68, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
  },
});

function WidgetControl() {
  const connectionState = useConnectionState();
  const widgetState = useWidgetStore((state) => state.widgetState);
  const ctaButtons = useCtaButtons();

  const setWidgetDisplayMode = useWidgetStore(
    (state) => state.setWidgetDisplayMode,
  );
  const widgetType = useStore((state) => state.widgetType);

  useChangeTracker(connectionState, (state) => {
    analytics.trackLivekitConnection(state);

    if (state === "disconnected") {
      resetAllStores(); // Reset all stores to initial state on disconnect
    }
  });

  async function handleEndCall() {
    analytics.track("minimize_clicked");
    // Minimize the widget instead of closing it
    setWidgetDisplayMode("minimized");
  }

  if (widgetState !== "active") return null;

  // Desktop layout
  return (
    <>
      <TopRightActions>
        {/* Slides module manages its own presentation mode controls */}
        <PresentationModeControls />

        {/* CTA buttons from session config */}
        {ctaButtons?.map((button, index) => (
          <StyledCtaButton
            key={index}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              analytics.track("cta_button_clicked", {
                label: button.label,
                url: button.url,
              })
            }
          >
            <ExternalLink />
            {button.label}
          </StyledCtaButton>
        ))}

        {/* Non-pitch widgets show TalkToHuman and Exit buttons */}
        {widgetType !== "pitch" && <TalkToHumanButton variant="desktop" />}
        {widgetType !== "pitch" && widgetType !== "direct" && (
          <StyledExitButton onClick={handleEndCall} icon={X} aria-label="Exit">
            Exit
          </StyledExitButton>
        )}
      </TopRightActions>
      <FixedBottomRight>
        <PoweredByBadge variant="large" />
      </FixedBottomRight>
    </>
  );
}

export default React.memo(WidgetControl);
