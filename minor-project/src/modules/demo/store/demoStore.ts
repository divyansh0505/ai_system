import { create } from "zustand";
import { useSessionStore } from "@/store/sessionStore";

/**
 * Navigation request for demo iframe
 */
export interface NavigationRequest {
  selector: string;
  selectorType: string;
  timestamp: number;
}

/**
 * Storage clear request for demo iframe
 */
export interface ClearStorageRequest {
  timestamp: number;
}

/**
 * Demo module state store
 * Manages runtime state related to the demo player functionality
 * Note: demoUrl is stored in sessionStore, accessed via useDemoUrl selector
 */
interface DemoState {
  // Navigation state - request to navigate to a specific element in the demo
  demoNavigationRequest: NavigationRequest | null;

  // Storage state - request to clear demo iframe's localStorage
  demoClearStorageRequest: ClearStorageRequest | null;

  // Actions
  requestDemoNavigation: (selector: string, selectorType: string) => void;
  clearDemoNavigationRequest: () => void;
  requestDemoClearStorage: () => void;
  dismissStorageRequest: () => void;
}

/**
 * Demo store - manages demo player runtime state
 * demoUrl is accessed from sessionStore via useDemoUrl selector
 */
export const useDemoStore = create<DemoState>((set) => ({
  // Initial state
  demoNavigationRequest: null,
  demoClearStorageRequest: null,

  // Request navigation to a specific element in the demo iframe
  requestDemoNavigation: (selector: string, selectorType: string) => {
    set({
      demoNavigationRequest: {
        selector,
        selectorType,
        timestamp: Date.now(),
      },
    });
  },

  // Clear the navigation request after it's been processed
  clearDemoNavigationRequest: () => set({ demoNavigationRequest: null }),

  // Request to clear the demo iframe's localStorage
  requestDemoClearStorage: () => {
    set({
      demoClearStorageRequest: {
        timestamp: Date.now(),
      },
    });
  },

  // Dismiss the storage clear request after it's been processed
  dismissStorageRequest: () => set({ demoClearStorageRequest: null }),
}));

// Selector to get demoUrl from sessionStore
export const useDemoUrl = () =>
  useSessionStore((state) => state.session?.demo_url ?? null);
