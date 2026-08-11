export const LIVEKIT_SERVER_URL = import.meta.env.VITE_LIVEKIT_URL;

export const ORG_ID = import.meta.env.VITE_ORG_ID;

export const CALENDLY_URL =
  import.meta.env.VITE_CALENDLY_URL ||
  "https://calendly.com/utsavsinghal5/30min";

export const REVENUE_HERO_URL =
  import.meta.env.VITE_REVENUE_HERO_URL ||
  "https://sprinto.schedulehero.io/inbound/interact-ai-router";

export const ORG_INFO = {
  id: ORG_ID,
  name: "Sprinto",
  logo: "https://s3.us-east-1.amazonaws.com/hacku.humanisys.ai/sprinto.png",
};

export const QUESTIONS = [
  "What is Interact AI?",
  "How does it work?",
  "What are the benefits?",
  "How can I get started?",
  "What is the pricing?",
  "How do I contact support?",
];

export const MESSAGE_TYPES = {
  START_CALL: "START_CALL",
  STOP_CALL: "STOP_CALL",
  SEND_MESSAGE: "SEND_MESSAGE",
  START_SPEAKING: "START_SPEAKING",
  STOP_SPEAKING: "STOP_SPEAKING",
};

// Layout configuration
export const SCREEN_BREAKPOINT_LG = 1500; // Large screen breakpoint (px)
export const MESSAGE_BOX_WIDTH = 30; // Message box width in rem (from Widget.tsx grid layout)

// Device breakpoints
export const MOBILE_BREAKPOINT = 768; // Mobile device breakpoint (px)
export const TABLET_BREAKPOINT = 1024; // Tablet device breakpoint (px)

// In rem units
export const VIDEO_SIZES = {
  DEFAULT: {
    width: 15,
    height: 15,
  },
  LARGE: {
    width: 30,
    height: 18.75,
  },
} as const;
