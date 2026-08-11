import { create } from "zustand";

export type WidgetState = "loading" | "compliance" | "email" | "active";

export type WidgetDisplayMode = "full" | "minimized";

// Define the widget store state
interface WidgetStoreState {
  // Widget/Onboarding state
  widgetState: WidgetState;
  widgetDisplayMode: WidgetDisplayMode;

  // Banner minimized state - tracks if the bottom banner should show in minimized mode
  isBannerMinimized: boolean;

  // Widget state setters
  setWidgetState: (state: WidgetState) => void;
  setWidgetDisplayMode: (mode: WidgetDisplayMode) => void;

  // Banner minimized setter
  setIsBannerMinimized: (isMinimized: boolean) => void;

  // Reset function
  reset: () => void;
}

export const useWidgetStore = create<WidgetStoreState>((set) => ({
  // Widget state initial state (starts with email capture)
  widgetState: "email",

  // Widget display mode (full screen or minimized)
  widgetDisplayMode: "full",

  // Banner minimized state - initially false (expanded)
  isBannerMinimized: false,

  // Widget state setters
  setWidgetState: (widgetState: WidgetState) => set({ widgetState }),
  setWidgetDisplayMode: (widgetDisplayMode: WidgetDisplayMode) =>
    set({ widgetDisplayMode }),

  // Banner minimized setter
  setIsBannerMinimized: (isBannerMinimized: boolean) =>
    set({ isBannerMinimized }),

  // Reset function
  reset: () =>
    set({
      widgetState: "email",
      widgetDisplayMode: "full",
      isBannerMinimized: true,
    }),
}));
