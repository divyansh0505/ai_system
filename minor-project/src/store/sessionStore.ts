import { create } from "zustand";

export type Auth = {
  accessToken: string;
  refreshToken: string;
};

export type Session = {
  id: string;
  token?: string;
  userName?: string;
  userId?: string;
  roomName?: string;
  sessionId?: string;
  slides?: string[];
  demo_url?: string | null;
  cta_buttons?: { label: string; url: string }[] | null;
};

type SessionStore = {
  email: string;
  auth: Auth | null;
  session: Session | null;
  hubspotutk?: string;
  setAuth: (auth: Auth | null) => void;
  setSession: (session: Session | null) => void;
  setHubspotUtk: (hubspotutk: string | undefined) => void;
  setEmail: (email: string) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionStore>()((set) => ({
  auth: null,
  email: "",
  session: null,
  hubspotutk: "",
  setHubspotUtk: (hubspotutk) => set({ hubspotutk }),
  setAuth: (auth) => set({ auth }),
  setSession: (session) => set({ session }),
  setEmail: (email) => set({ email }),
  reset: () =>
    set({
      auth: null,
      email: "",
      session: null,
      hubspotutk: "",
    }),
}));

// Selectors for accessing session data
export const useSlides = () =>
  useSessionStore((state) => state.session?.slides ?? []);

export const useDemoUrl = () =>
  useSessionStore((state) => state.session?.demo_url ?? null);

export const useCtaButtons = () =>
  useSessionStore((state) => state.session?.cta_buttons ?? []);
