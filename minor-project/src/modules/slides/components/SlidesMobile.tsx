import * as React from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { setPresentationState as setAgentPresentationState } from "@/services/agentRPC";
import { ChevronLeft, ChevronRight, PanelRight } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useSlideNavigation } from "../hooks/useSlideNavigation";

import SlideViewer from "./SlideViewer";
import SlideControlPanel from "./SlideControlPanel";
import SlideNavigationPanel from "./SlideNavigationPanel";
import Calendar from "@/modules/calendar";

const Container = styled.div({
  // Use position fixed to anchor to viewport edges, not document flow
  // This ensures content respects the actual visible viewport
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: "hidden",
  display: "flex",
  boxSizing: "border-box",
  // Safe area padding for notch/home indicator
  paddingTop: "env(safe-area-inset-top, 0px)",
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  paddingLeft: "env(safe-area-inset-left, 0px)",
  paddingRight: "env(safe-area-inset-right, 0px)",

  // Force landscape display on portrait orientation
  "@media (orientation: portrait)": {
    transform: "rotate(90deg)",
    transformOrigin: "center center",
    width: "100dvh",
    height: "100dvw",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginLeft: "-50dvh",
    marginTop: "-50dvw",
    // When rotated, safe areas swap: physical top becomes logical left, etc.
    paddingTop: "env(safe-area-inset-left, 0px)",
    paddingBottom: "env(safe-area-inset-right, 0px)",
    paddingLeft: "env(safe-area-inset-bottom, 0px)",
    paddingRight: "env(safe-area-inset-top, 0px)",
  },
});

const SlideArea = styled.div({
  flex: 1,
  position: "relative",
  overflow: "hidden",
  width: "100%",
  height: "100%",
});

const ControlPanelContainer = styled(motion.div)({
  width: "150px",
  height: "100%",
  backgroundColor: "#fff",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  flexShrink: 0,
  borderLeft: "1px solid #E4E4E7",
  position: "relative",
});

const CalendarOverlay = styled.div({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: 600,
  backgroundColor: "rgba(0, 0, 0, 0.95)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
});

// Overlay controls when panel is hidden
const OverlayControls = styled(motion.div)({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: 10,
});

const NavButton = styled(motion.button)<{ position: "left" | "right" }>(
  ({ position }) => ({
    position: "absolute",
    top: "50%",
    [position]: "1rem",
    transform: "translateY(-50%)",
    width: "3.5rem",
    height: "3.5rem",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow:
      "0 4px 8px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
    borderRadius: "50%",
    color: "#4F46E5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    "&:active": {
      transform: "translateY(-50%) scale(0.95)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  }),
);

const MenuButton = styled(motion.button)({
  position: "absolute",
  top: "0.5rem",
  right: "1.25rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.5rem",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  pointerEvents: "auto",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 100%)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    transform: "translateY(-1px)",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
});

function SlidesMobile() {
  const [isPanelVisible, setIsPanelVisible] = React.useState(true);
  const [isSlideNavVisible, setIsSlideNavVisible] = React.useState(false);
  const { isLandscape } = useDeviceDetection();

  // When device is in portrait mode, the UI is rotated 90deg via CSS
  const isRotated = !isLandscape;

  const {
    slides,
    currentSlideIndex,
    setCurrentSlideIndex,
    handlePrevSlide,
    handleNextSlide,
    handleSlideSelect,
    canGoPrev,
    canGoNext,
  } = useSlideNavigation();

  const contentMode = useAssistantStore((state) => state.contentMode);
  const setPresentationState = useAssistantStore(
    (state) => state.setPresentationState,
  );

  const isCalendarVisible = contentMode === ContentMode.CALENDAR;

  const handleTogglePanel = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  const handleGoToSlide = () => {
    setIsSlideNavVisible(true);
  };

  const handleBackFromSlideNav = () => {
    setIsSlideNavVisible(false);
  };

const handleSlideSelectAndGoBack = React.useCallback(
    (index: number) => {
      handleSlideSelect(index);
      setIsSlideNavVisible(false);
    },
    [handleSlideSelect],
  );

  // Pause/resume agent speaking when panel visibility changes
  React.useEffect(() => {
    const newState = isPanelVisible ? "play" : "pause";
    setPresentationState(newState);
    setAgentPresentationState(newState);
  }, [isPanelVisible, setPresentationState]);

  return (
    <Container>
      <SlideArea>
        <SlideViewer
          slides={slides}
          currentSlide={currentSlideIndex}
          onSlideChange={setCurrentSlideIndex}
          isRotated={isRotated}
        />

        {/* Overlay controls when panel is hidden */}
        <AnimatePresence>
          {!isPanelVisible && (
            <OverlayControls
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Previous slide button */}
              <NavButton
                position="left"
                onClick={handlePrevSlide}
                disabled={!canGoPrev}
                aria-label="Previous slide"
              >
                <ChevronLeft size={28} />
              </NavButton>

              {/* Next slide button */}
              <NavButton
                position="right"
                onClick={handleNextSlide}
                disabled={!canGoNext}
                aria-label="Next slide"
              >
                <ChevronRight size={28} />
              </NavButton>

              {/* Menu button to open panel */}
              <MenuButton
                onClick={handleTogglePanel}
                aria-label="Open control panel"
              >
                <PanelRight size={22} color="#2B5CE3" />
              </MenuButton>
            </OverlayControls>
          )}
        </AnimatePresence>

        {/* Calendar overlay (when visible) */}
        {isCalendarVisible && (
          <CalendarOverlay>
            <Calendar />
          </CalendarOverlay>
        )}
      </SlideArea>

      {/* Control Panel or Slide Navigation */}
      <ControlPanelContainer
        animate={{
          width: isPanelVisible ? "150px" : "0px",
          opacity: isPanelVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {isSlideNavVisible ? (
          <SlideNavigationPanel
            slides={slides}
            currentSlide={currentSlideIndex}
            onSlideSelect={handleSlideSelectAndGoBack}
            onBack={handleBackFromSlideNav}
          />
        ) : (
          <SlideControlPanel
            currentSlide={currentSlideIndex}
            totalSlides={slides.length}
            onPrevSlide={handlePrevSlide}
            onNextSlide={handleNextSlide}
            onTogglePanel={handleTogglePanel}
            onGoToSlide={handleGoToSlide}
          />
        )}
      </ControlPanelContainer>
    </Container>
  );
}

export default React.memo(SlidesMobile);
