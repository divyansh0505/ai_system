import { useSessionStore } from "@/store/sessionStore";
import { useAssistantStore } from "@/store/assistantStore";
import { useWidgetStore } from "@/store/widgetStore";
import { useStore } from "@/store";
import { useMessagesStore } from "@/store/messagesStore";
import { useSlidesStore } from "@/modules/slides/store/slidesStore";

/**
 * Resets all Zustand stores to their initial state.
 * Call this when the user completely disconnects (not just minimizes).
 *
 * This will clear:
 * - Session authentication and email
 * - Assistant/connection state
 * - Widget state and display mode
 * - Chat messages
 * - Slides state
 * - Main widget state
 *
 * @example
 * // In your disconnect handler
 * await room.disconnect();
 * resetAllStores();
 */
export const resetAllStores = () => {
  // Reset session store (clears email, auth, session data)
  useSessionStore.getState().reset();

  // Reset assistant store (connection state, suggestions, etc.)
  useAssistantStore.getState().reset();

  // Reset widget store (widget state, display mode, banner)
  useWidgetStore.getState().reset();

  // Reset main store (isOpen, view, widgetType, initialQuestion)
  useStore.getState().reset();

  // Clear messages
  useMessagesStore.getState().clearMessages();

  // Reset slides store (currentSlide, presentation mode)
  useSlidesStore.getState().reset();
};
