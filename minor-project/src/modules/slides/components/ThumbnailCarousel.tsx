import * as React from "react";
import { useEffect, useRef } from "react";
import styled from "@emotion/styled";

interface ThumbnailCarouselProps {
  slides: string[];
  currentSlide: number;
  onSlideClick: (index: number) => void;
}

const CarouselContainer = styled.div({
  width: "100%",
  padding: "0 0.5rem",
  overflowX: "hidden",
});

const CarouselTrack = styled.div({
  display: "flex",
  gap: "1rem",
  overflowX: "auto",
  scrollBehavior: "smooth",
  paddingBottom: "0.5rem",
  paddingTop: "0.5rem",
  "&::-webkit-scrollbar": {
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "3px",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.3)",
    },
  },
});

const ThumbnailWrapper = styled.div<{ isActive: boolean }>(({ isActive }) => ({
  flexShrink: 0,
  width: "calc((100% - 3.5rem) / 4.5)", // Show 4.5 thumbnails
  aspectRatio: "16 / 9",
  overflow: "hidden",
  cursor: "pointer",
  outline: isActive ? "3px solid #2B5CE3" : "none",
  outlineOffset: "-2px",
  transition: "all 0.2s ease",
  position: "relative",
  borderRadius: "8px",
  border: "1px solid  #D4D4D8",
  "&:hover": {
    transform: "scale(1.05)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  "&::after": isActive
    ? {
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(43, 92, 227, 0.15) 100%)",
        pointerEvents: "none",
      }
    : {},
}));

const ThumbnailImage = styled.img({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
});

const SlideNumber = styled.div({
  position: "absolute",
  top: "0.5rem",
  left: "0.5rem",
  background: "rgba(0, 0, 0, 0.7)",
  color: "#fff",
  padding: "0.25rem 0.5rem",
  borderRadius: "0.25rem",
  fontSize: "0.75rem",
  fontFamily: "'SF Pro Display', sans-serif",
  fontWeight: 600,
});

function ThumbnailCarousel({
  slides,
  currentSlide,
  onSlideClick,
}: ThumbnailCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to keep active slide visible
  useEffect(() => {
    const activeThumbnail = thumbnailRefs.current[currentSlide];
    if (activeThumbnail && trackRef.current) {
      const track = trackRef.current;
      const thumbnail = activeThumbnail;

      const trackRect = track.getBoundingClientRect();
      const thumbnailRect = thumbnail.getBoundingClientRect();

      const isVisible =
        thumbnailRect.left >= trackRect.left &&
        thumbnailRect.right <= trackRect.right;

      if (!isVisible) {
        // Calculate scroll position to center the thumbnail
        const thumbnailCenter =
          thumbnail.offsetLeft + thumbnail.offsetWidth / 2;
        const trackCenter = track.offsetWidth / 2;
        const scrollPosition = thumbnailCenter - trackCenter;

        track.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [currentSlide]);

  return (
    <CarouselContainer>
      <CarouselTrack ref={trackRef}>
        {slides.map((slide, index) => (
          <ThumbnailWrapper
            key={index}
            isActive={index === currentSlide}
            onClick={() => onSlideClick(index)}
            ref={(el) => (thumbnailRefs.current[index] = el)}
          >
            <ThumbnailImage src={slide} alt={`Slide ${index + 1}`} />
            <SlideNumber>{index + 1}</SlideNumber>
          </ThumbnailWrapper>
        ))}
      </CarouselTrack>
    </CarouselContainer>
  );
}

export default React.memo(ThumbnailCarousel);
