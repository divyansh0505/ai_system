import * as React from "react";
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface SlideViewerProps {
  slides: string[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
  /** When true, UI is rotated 90deg (portrait mode), so use Y-axis for swipe detection */
  isRotated?: boolean;
}

const SlidesContainer = styled.div({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  position: "relative",
});

const SlideViewerContainer = styled.div({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  minHeight: 0,
  position: "relative",
});

const AnimatedWrapper = styled(motion.div)({
  position: "absolute",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const SlideImage = styled(motion.img)({
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  userSelect: "none",
  pointerEvents: "none", // Disable pointer events on image, let overlay handle swipe
});

// Invisible overlay to capture swipe gestures without moving the image
const SwipeOverlay = styled(motion.div)({
  position: "absolute",
  inset: 0,
  zIndex: 1,
  touchAction: "none", // Prevent browser handling of touch gestures
});

function SlideViewer({
  slides,
  currentSlide,
  onSlideChange,
  isRotated = false,
}: SlideViewerProps) {
  const [direction, setDirection] = useState(0);
  const [prevSlide, setPrevSlide] = useState(currentSlide);

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

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const newIndex = currentSlide + newDirection;
    if (newIndex >= 0 && newIndex < slides.length) {
      setDirection(newDirection);
      onSlideChange(newIndex);
    }
  };

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    { offset, velocity }: PanInfo,
  ) => {
    // Calculate swipe power for both axes
    const swipeX = swipePower(offset.x, velocity.x);
    const swipeY = swipePower(offset.y, velocity.y);

    const swipe = isRotated ? swipeY : swipeX;

    if (swipe < -swipeConfidenceThreshold) {
      // Swiped left (or up when rotated) → go to next slide
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      // Swiped right (or down when rotated) → go to previous slide
      paginate(-1);
    }
  };

  // Update direction when currentSlide changes externally (from control panel)
  useEffect(() => {
    if (currentSlide !== prevSlide) {
      setDirection(currentSlide > prevSlide ? 1 : -1);
      setPrevSlide(currentSlide);
    }
  }, [currentSlide, prevSlide]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <SlidesContainer>
      <SlideViewerContainer>
        <AnimatePresence initial={false} custom={direction}>
          <AnimatedWrapper
            key={currentSlide}
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
              src={slides[currentSlide]}
              alt={`Slide ${currentSlide + 1}`}
            />
          </AnimatedWrapper>
        </AnimatePresence>
        {/* Invisible overlay to capture swipe gestures */}
        <SwipeOverlay
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        />
      </SlideViewerContainer>
    </SlidesContainer>
  );
}

export default React.memo(SlideViewer);
