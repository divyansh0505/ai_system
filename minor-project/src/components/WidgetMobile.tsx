import * as React from "react";
import styled from "@emotion/styled";
import { useStore } from "@/store";
import { useSlides } from "@/store/sessionStore";

import { SlidesMobile } from "@/modules/slides";

const MobileContainer = styled.div({
  width: "100dvw",
  height: "100dvh",
  position: "relative",
  overflow: "hidden",
  backgroundColor: "#000",
  display: "flex",
  // Add safe area padding to prevent content from going behind browser chrome
  paddingTop: "env(safe-area-inset-top, 0px)",
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  paddingLeft: "env(safe-area-inset-left, 0px)",
  paddingRight: "env(safe-area-inset-right, 0px)",
  boxSizing: "border-box",

  // Force landscape display on portrait orientation
  "@media (orientation: portrait)": {
    transform: "rotate(90deg)",
    transformOrigin: "center center",
    width: "100dvh",
    height: "100dvw",
    position: "fixed",
    top: "50%",
    left: "50%",
    marginLeft: "-50dvh",
    marginTop: "-50dvw",
    // When rotated, safe areas swap: physical top becomes logical left, etc.
    paddingTop: "env(safe-area-inset-left, 0px)",
    paddingBottom: "env(safe-area-inset-right, 0px)",
    paddingLeft: "env(safe-area-inset-bottom, 0px)",
    paddingRight: "env(safe-area-inset-top, 0px)",
  },
});

const UseDesktopMessage = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  padding: "2rem",
  textAlign: "center",
  color: "#fff",
  gap: "1.5rem",
});

const Icon = styled.div({
  fontSize: "4rem",
  marginBottom: "0.5rem",
});

const Title = styled.h2({
  fontSize: "1.5rem",
  fontWeight: "600",
  margin: 0,
  fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
});

const Description = styled.p({
  fontSize: "1rem",
  fontWeight: "400",
  margin: 0,
  color: "rgba(255, 255, 255, 0.7)",
  maxWidth: "400px",
  lineHeight: "1.5",
  fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
});

function WidgetMobile() {
  const widgetType = useStore((state) => state.widgetType);
  const slides = useSlides();

  // Pitch mode: Show dedicated pitch layout with slides
  if (widgetType === "pitch" && slides.length > 0) {
    return <SlidesMobile />;
  }

  // Non-pitch mode: Show "use desktop" message
  return (
    <MobileContainer>
      <UseDesktopMessage>
        <Icon>📱 → 💻</Icon>
        <Title>Mobile not supported for this mode</Title>
        <Description>
          Please open this on a desktop browser for the full experience.
        </Description>
      </UseDesktopMessage>
    </MobileContainer>
  );
}

export default React.memo(WidgetMobile);
