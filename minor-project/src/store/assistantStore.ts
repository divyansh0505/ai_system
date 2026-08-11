import { create } from "zustand";
import { SessionStatus } from "@/services/analytics";

// Content modes for the main content area
export enum ContentMode {
  DEMO = "demo",
  CALENDAR = "calendar",
  SLIDES = "slides",
}

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

// Define the message interface (legacy - will be replaced by transcriptions)
export interface SessionMessage {
  id: string;
  content: string;
  role: string;
  timestamp: Date;
}

// Define the chat service store state
interface AssistantState {
  // Session outcome tracking
  sessionOutcome: SessionStatus;
  suggestions: string[];

  // Agent video ready state - indicates if agent's video track is available
  agentVideoReady: boolean;

  // Email collection state for pitch mode
  userEmail: string;
  emailSubmitted: boolean;

  contentMode: ContentMode;
  preloadedMode: ContentMode | null;

  // Presentation state (for slides)
  presentationState: "play" | "pause";

  // Simple setters
  setSessionOutcome: (outcome: SessionStatus) => void;
  setSuggestions: (suggestions: string[]) => void;

  // Agent video ready setters
  setAgentVideoReady: (ready: boolean) => void;

  // Content mode setters
  setContentMode: (mode: ContentMode) => void;
  setPreloadedMode: (mode: ContentMode | null) => void;

  // Presentation setters
  setPresentationState: (state: "play" | "pause") => void;

  // Email collection setters
  setUserEmail: (email: string) => void;
  setEmailSubmitted: (submitted: boolean) => void;

  // Reset function
  reset: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  // Session outcome defaults to ABANDONED (user left without completing)
  sessionOutcome: SessionStatus.ABANDONED,
  suggestions: [],

  // Agent video ready state - initially false until video track is available
  agentVideoReady: false,

  // Email collection initial state
  userEmail: "",
  emailSubmitted: false,

  // Content mode initial state (starts with demo)
  contentMode: ContentMode.DEMO,
  preloadedMode: null,

  // Presentation initial state
  presentationState: "play",

  // Simple setters

  setSessionOutcome: (sessionOutcome: SessionStatus) => set({ sessionOutcome }),
  setSuggestions: (suggestions: string[]) => set({ suggestions }),

  // Agent video ready setters
  setAgentVideoReady: (agentVideoReady: boolean) => set({ agentVideoReady }),

  // Email setters
  setUserEmail: (userEmail: string) => set({ userEmail }),
  setEmailSubmitted: (emailSubmitted: boolean) => set({ emailSubmitted }),

  // Content mode setters
  setContentMode: (contentMode: ContentMode) => set({ contentMode }),
  setPreloadedMode: (preloadedMode: ContentMode | null) =>
    set({ preloadedMode }),

  // Presentation setters
  setPresentationState: (state: "play" | "pause") =>
    set({ presentationState: state }),

  // Reset function
  reset: () =>
    set({
      sessionOutcome: SessionStatus.ABANDONED,
      suggestions: [],
      agentVideoReady: false,
      userEmail: "",
      emailSubmitted: false,
      contentMode: ContentMode.DEMO,
      preloadedMode: null,
      presentationState: "play",
    }),
}));
