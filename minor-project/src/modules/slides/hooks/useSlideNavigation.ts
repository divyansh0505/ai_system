import * as React from "react";
import { useAssistantStore } from "@/store/assistantStore";
import { useSlidesStore } from "../store/slidesStore";
import { useSlides } from "@/store/sessionStore";
import { navigateToSlide, startPresentation } from "@/services/agentRPC";

interface UseSlideNavigationReturn {
  slides: string[];
  currentSlideIndex: number;
  isPresentationMode: boolean;
  setCurrentSlideIndex: (index: number) => void;
  handlePrevSlide: () => Promise<void>;
  handleNextSlide: () => Promise<void>;
  handleSlideSelect: (index: number) => Promise<void>;
  canGoPrev: boolean;
  canGoNext: boolean;
}

/**
 * Custom hook for slide navigation logic shared between Desktop and Mobile components.
 * Handles store access, navigation with RPC calls, and the startPresentation effect.
 */
export function useSlideNavigation(): UseSlideNavigationReturn {
  // Store selectors
  const slides = useSlides();
  const currentSlideIndex = useSlidesStore((state) => state.currentSlide);
  const setCurrentSlideIndex = useSlidesStore((state) => state.setCurrentSlide);
  const isPresentationMode = useSlidesStore(
    (state) => state.isPresentationMode,
  );
  const agentVideoReady = useAssistantStore((state) => state.agentVideoReady);

  // Start presentation when agent video becomes ready
  React.useEffect(() => {
    if (!agentVideoReady) return;
    startPresentation();
  }, [agentVideoReady]);

  const canGoPrev = currentSlideIndex > 0;
  const canGoNext = currentSlideIndex < slides.length - 1;

  const handlePrevSlide = React.useCallback(async () => {
    if (!canGoPrev) return;

    const newIndex = currentSlideIndex - 1;
    setCurrentSlideIndex(newIndex);

    // Only make RPC call when not in presentation mode (agent is not controlling)
    if (!isPresentationMode) {
      await navigateToSlide(newIndex + 1); // 1-based index
    }
  }, [canGoPrev, currentSlideIndex, setCurrentSlideIndex, isPresentationMode]);

  const handleNextSlide = React.useCallback(async () => {
    if (!canGoNext) return;

    const newIndex = currentSlideIndex + 1;
    setCurrentSlideIndex(newIndex);

    // Only make RPC call when not in presentation mode (agent is not controlling)
    if (!isPresentationMode) {
      await navigateToSlide(newIndex + 1); // 1-based index
    }
  }, [canGoNext, currentSlideIndex, setCurrentSlideIndex, isPresentationMode]);

  const handleSlideSelect = React.useCallback(
    async (index: number) => {
      if (index === currentSlideIndex) return;
      if (index < 0 || index >= slides.length) return;

      setCurrentSlideIndex(index);

      // Only make RPC call when not in presentation mode (agent is not controlling)
      if (!isPresentationMode) {
        await navigateToSlide(index + 1); // 1-based index
      }
    },
    [
      currentSlideIndex,
      slides.length,
      setCurrentSlideIndex,
      isPresentationMode,
    ],
  );

  return {
    slides,
    currentSlideIndex,
    isPresentationMode,
    setCurrentSlideIndex,
    handlePrevSlide,
    handleNextSlide,
    handleSlideSelect,
    canGoPrev,
    canGoNext,
  };
}
