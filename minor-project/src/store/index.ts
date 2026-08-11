import { create } from "zustand";

const EXIT_INTENT_STORAGE_KEY = "interactnow-exit-intent";

export interface WidgetConfig {
  domain: string;
  startFullscreen?: boolean;
  theme: {
    primary: string;
  };
}

export enum WidgetView {
  Welcome = "welcome",
  RequestPermission = "requestPermission",
  Onboarding = "onboarding",
  Chat = "chat",
}

export type WidgetType =
  | "pitch"
  | "inline"
  | "bottom"
  | "modal"
  | "direct"
  | null;

export interface ExitIntentState {
  isOpen: boolean;
  hasShown: boolean;
}

interface ChatState {
  isOpen: boolean;
  view: WidgetView;
  config: WidgetConfig;
  widgetType: WidgetType;
  initialQuestion: string | null;
  exitIntent: ExitIntentState;
  toggle: () => void;
  setView: (view: WidgetView) => void;
  setConfig: (config: WidgetConfig) => void;
  setWidgetType: (widgetType: WidgetType) => void;
  setInitialQuestion: (question: string | null) => void;
  openExitIntent: () => void;
  closeExitIntent: () => void;
  markExitIntentShown: () => void;
  resetExitIntent: () => void;
  reset: () => void;
}

const getInitialExitIntentState = (): ExitIntentState => {
  if (typeof window === "undefined") {
    return { isOpen: false, hasShown: false };
  }
  try {
    const stored = localStorage.getItem(EXIT_INTENT_STORAGE_KEY);
    if (stored === "true") {
      return { isOpen: false, hasShown: true };
    }
  } catch (error) {
    console.warn("[ExitIntent] Failed to read from localStorage:", error);
  }
  return { isOpen: false, hasShown: false };
};

const persistExitIntent = (hasShown: boolean) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXIT_INTENT_STORAGE_KEY, hasShown ? "true" : "false");
  } catch (error) {
    console.warn("[ExitIntent] Failed to write to localStorage:", error);
  }
};

export const useStore = create<ChatState>((set) => ({
  // TODO: Get initial state from config provided by the customer
  isOpen: false,
  view: WidgetView.Welcome,
  config: {
    domain: "",
    theme: {
      primary: "#007bff", // Default primary color
      background: "#0f172a",
    },
  },
  widgetType: null,
  initialQuestion: null,
  exitIntent: getInitialExitIntentState(),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setView: (view) => set({ view }),
  setConfig: (config: WidgetConfig) => set({ config }),
  setWidgetType: (widgetType: WidgetType) => set({ widgetType }),
  setInitialQuestion: (question: string | null) =>
    set({ initialQuestion: question }),
  openExitIntent: () =>
    set(() => {
      persistExitIntent(true);
      return { exitIntent: { isOpen: true, hasShown: true } };
    }),
  closeExitIntent: () =>
    set((state) => ({
      exitIntent: { ...state.exitIntent, isOpen: false },
    })),
  markExitIntentShown: () =>
    set((state) => {
      persistExitIntent(true);
      return { exitIntent: { ...state.exitIntent, hasShown: true } };
    }),
  resetExitIntent: () => {
    persistExitIntent(false);
    set({ exitIntent: { isOpen: false, hasShown: false } });
  },
  reset: () =>
    set({
      view: WidgetView.Welcome,
      widgetType: null,
      initialQuestion: null,
    }),
}));
