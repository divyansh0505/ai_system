import * as React from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { FrameContext } from "react-frame-component";
import { useAssistantStore } from "@/store/assistantStore";
import { useSlidesStore } from "../store/slidesStore";
import { setPresentationState as setAgentPresentationState } from "@/services/agentRPC";
import { useKeyboardEvent } from "@/hooks/useKeyboardEvent";
import { useSlideNavigation } from "../hooks/useSlideNavigation";
import SlideControls from "./SlideControls";
import ThumbnailCarousel from "./ThumbnailCarousel";

const SlidesContainer = styled.div<{ isPresentationMode: boolean }>(
  ({ isPresentationMode }) => ({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: isPresentationMode ? "0" : "1rem",
    overflow: "hidden",
    position: isPresentationMode ? "fixed" : "relative",
    top: isPresentationMode ? 0 : "auto",
    left: isPresentationMode ? 0 : "auto",
    right: isPresentationMode ? 0 : "auto",
    bottom: isPresentationMode ? 0 : "auto",
    zIndex: isPresentationMode ? 9999 : 1,
  }),
);

const SlideViewerContainer = styled.div<{ isPresentationMode: boolean }>(
  ({ isPresentationMode }) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: isPresentationMode ? "hidden" : "visible",
    minHeight: 0, // Important for flex children
    position: "relative",
  }),
);

const AnimatedWrapper = styled(motion.div)({
  position: "absolute",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const SlideImage = styled.img<{ isPresentationMode: boolean }>(
  ({ isPresentationMode }) => ({
    width: isPresentationMode ? "100dvw" : "auto",
    height: isPresentationMode ? "100dvh" : "auto",
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
    boxSizing: "border-box",
    boxShadow: isPresentationMode ? "none" : "0 4px 16px 0 rgba(0, 0, 0, 0.12)",
  }),
);

const ControlsWrapper = styled.div<{ isPresentationMode: boolean }>(
  ({ isPresentationMode }) =>
    isPresentationMode
      ? {
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0,
          transition: "opacity 0.3s ease",
          [`${SlidesContainer}:hover &`]: {
            opacity: 1,
          },
        }
      : {
          position: "absolute",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
        },
);

const ThumbnailSection = styled.div({
  width: "100%",
  paddingBottom: "1rem",
  paddingTop: "1rem",
  position: "relative",
});

function SlidesDesktop() {
  const [direction, setDirection] = React.useState(0);

  // Get the iframe's window for keyboard events
  const frameContext = React.useContext(FrameContext);
  const targetWindow = frameContext?.window || window;

  const {
    slides,
    currentSlideIndex,
    isPresentationMode,
    handlePrevSlide: basePrevSlide,
    handleNextSlide: baseNextSlide,
    handleSlideSelect,
    canGoPrev,
    canGoNext,
  } = useSlideNavigation();

  const setPresentationMode = useSlidesStore(
    (state) => state.setPresentationMode,
  );
  const setPresentationState = useAssistantStore(
    (state) => state.setPresentationState,
  );

  // Pause agent when entering presentation mode
  React.useEffect(() => {
    if (isPresentationMode) {
      setPresentationState("pause");
      setAgentPresentationState("pause").catch((error) => {
        console.error("Failed to pause agent in presentation mode:", error);
      });
    }
  }, [isPresentationMode, setPresentationState]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const handlePrevSlide = React.useCallback(async () => {
    if (canGoPrev) {
      setDirection(-1);
      await basePrevSlide();
    }
  }, [canGoPrev, basePrevSlide]);

  const handleNextSlide = React.useCallback(async () => {
    if (canGoNext) {
      setDirection(1);
      await baseNextSlide();
    }
  }, [canGoNext, baseNextSlide]);

  const handleSlideClick = React.useCallback(
    async (index: number) => {
      if (index !== currentSlideIndex) {
        setDirection(index > currentSlideIndex ? 1 : -1);
        await handleSlideSelect(index);
      }
    },
    [currentSlideIndex, handleSlideSelect],
  );

  useKeyboardEvent({
    key: "ArrowLeft",
    onKeyDown: handlePrevSlide,
    targetWindow,
  });

  useKeyboardEvent({
    key: "ArrowRight",
    onKeyDown: handleNextSlide,
    targetWindow,
  });

  useKeyboardEvent({
    key: "Escape",
    onKeyDown: isPresentationMode
      ? () => setPresentationMode(false)
      : undefined,
    targetWindow,
  });

  if (slides.length === 0) {
    return null;
  }

  return (
    <SlidesContainer isPresentationMode={isPresentationMode}>
      <SlideViewerContainer isPresentationMode={isPresentationMode}>
        <AnimatePresence initial={false} custom={direction}>
          <AnimatedWrapper
            key={currentSlideIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <SlideImage
              src={slides[currentSlideIndex]}
              alt={`Slide ${currentSlideIndex + 1}`}
              isPresentationMode={isPresentationMode}
            />
          </AnimatedWrapper>
        </AnimatePresence>
      </SlideViewerContainer>

      {isPresentationMode && (
        <ControlsWrapper isPresentationMode={isPresentationMode}>
          <SlideControls
            onPrev={handlePrevSlide}
            onNext={handleNextSlide}
            disablePrev={!canGoPrev}
            disableNext={!canGoNext}
            isPresentationMode={isPresentationMode}
          />
        </ControlsWrapper>
      )}

      {!isPresentationMode && (
        <ThumbnailSection>
          <ControlsWrapper isPresentationMode={isPresentationMode}>
            <SlideControls
              onPrev={handlePrevSlide}
              onNext={handleNextSlide}
              disablePrev={!canGoPrev}
              disableNext={!canGoNext}
              isPresentationMode={isPresentationMode}
            />
          </ControlsWrapper>
          <ThumbnailCarousel
            slides={slides}
            currentSlide={currentSlideIndex}
            onSlideClick={handleSlideClick}
          />
        </ThumbnailSection>
      )}
    </SlidesContainer>
  );
}

export default React.memo(SlidesDesktop);
