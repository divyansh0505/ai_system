import * as React from "react";
import { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { ChevronLeft } from "lucide-react";

interface SlideNavigationPanelProps {
  slides: string[];
  currentSlide: number;
  onSlideSelect: (index: number) => void | Promise<void>;
  onBack: () => void;
}

const PanelContainer = styled.div({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fff",
  overflow: "hidden",
});

const Header = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "0.5rem",
  borderBottom: "1px solid #E4E4E7",
});

const BackButton = styled.button({
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.25rem 0",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontFamily: "'SF Pro Display', sans-serif",
  fontWeight: 600,
  color: "#27272A",
  transition: "all 0.2s ease",
  "&:hover": {
    opacity: 0.7,
  },
});

const ThumbnailsContainer = styled.div({
  flex: 1,
  overflowY: "auto",
  padding: "0.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  alignItems: "center",

  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "#F4F4F5",
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#E4E4E7",
    borderRadius: "3px",
    "&:hover": {
      background: "#D4D4D8",
    },
  },
});

const ThumbnailWrapper = styled.div<{ isActive: boolean }>(({ isActive }) => ({
  position: "relative",
  width: "100%",
  maxWidth: "126px",
  aspectRatio: "16 / 9",
  borderRadius: "4px",
  overflow: "hidden",
  cursor: "pointer",
  border: isActive ? "2px solid #2B5CE3" : "1px solid #E4E4E7",
  flexShrink: 0,
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "scale(1.02)",
    borderColor: isActive ? "#2B5CE3" : "#A1A1AA",
  },
}));

const ThumbnailImage = styled.img({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
});

const SlideNumber = styled.div<{ isActive: boolean }>(({ isActive }) => ({
  position: "absolute",
  top: "4px",
  left: "4px",
  background: isActive ? "#2B5CE3" : "rgba(0, 0, 0, 0.75)",
  color: "#FAFAFA",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  fontSize: "9px",
  fontFamily: "'SF Pro Display', sans-serif",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

function SlideNavigationPanel({
  slides,
  currentSlide,
  onSlideSelect,
  onBack,
}: SlideNavigationPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to active slide
  useEffect(() => {
    const activeThumbnail = thumbnailRefs.current[currentSlide];
    if (activeThumbnail && containerRef.current) {
      activeThumbnail.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentSlide]);

  return (
    <PanelContainer>
      {/* Header with Back button */}
      <Header>
        <BackButton onClick={onBack}>
          <ChevronLeft size={18} />
          Back
        </BackButton>
      </Header>

      {/* Scrollable Thumbnails */}
      <ThumbnailsContainer ref={containerRef}>
        {slides.map((slide, index) => (
          <ThumbnailWrapper
            key={index}
            isActive={index === currentSlide}
            onClick={() => onSlideSelect(index)}
            ref={(el) => (thumbnailRefs.current[index] = el)}
          >
            <ThumbnailImage src={slide} alt={`Slide ${index + 1}`} />
            <SlideNumber isActive={index === currentSlide}>
              {index + 1}
            </SlideNumber>
          </ThumbnailWrapper>
        ))}
      </ThumbnailsContainer>
    </PanelContainer>
  );
}

export default React.memo(SlideNavigationPanel);
