// Public API - only export components used outside the module
export { default as SlidesDesktop } from "./components/SlidesDesktop";
export { default as SlidesMobile } from "./components/SlidesMobile";
export { PresentationModeControls } from "./components/PresentationModeControls";

// Export store hooks for components that need to react to presentation mode
export { useSlidesStore, usePresentationMode } from "./store/slidesStore";
export { useSlides } from "@/store/sessionStore";
