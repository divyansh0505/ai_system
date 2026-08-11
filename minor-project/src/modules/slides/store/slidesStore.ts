import { create } from "zustand";
import { analytics } from "@/services/analytics";
import { navigateToSlide } from "@/services/agentRPC";

export interface SlidesStore {
  // Runtime UI State
  currentSlide: number;
  isPresentationMode: boolean;

  // Actions
  setCurrentSlide: (slide: number) => void;
  setPresentationMode: (enabled: boolean) => void;
  enterPresentationMode: () => void;
  exitPresentationMode: () => Promise<void>;
  reset: () => void;
}

export const useSlidesStore = create<SlidesStore>((set, get) => ({
  // Initial state
  currentSlide: 0,
  isPresentationMode: false,

  // Basic setters
  setCurrentSlide: (currentSlide) => set({ currentSlide }),

  setPresentationMode: (isPresentationMode) => set({ isPresentationMode }),

  // Enter presentation mode with analytics
  enterPresentationMode: () => {
    analytics.track("slideshow_started");
    set({ isPresentationMode: true });
  },

  // Exit presentation mode with cleanup
  exitPresentationMode: async () => {
    analytics.track("slideshow_exited");

    // Notify agent about the current slide before exiting
    // Convert from 0-based to 1-based indexing for the agent
    const { currentSlide } = get();
    const slideNumber = currentSlide + 1;
    await navigateToSlide(slideNumber);

    set({ isPresentationMode: false });
  },

  // Reset function
  reset: () =>
    set({
      currentSlide: 0,
      isPresentationMode: false,
    }),
}));

// Convenience hook for just checking presentation mode
export const usePresentationMode = () =>
  useSlidesStore((state) => state.isPresentationMode);
