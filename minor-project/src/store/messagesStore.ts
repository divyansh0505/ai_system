import { create } from "zustand";
import { ReceivedChatMessage } from "@livekit/components-react";

interface MessagesStore {
  messages: ReceivedChatMessage[];
  setMessages: (messages: ReceivedChatMessage[]) => void;
  clearMessages: () => void;
}

/**
 * Persists messages across component unmounts during view transitions (minimize/maximize).
 * This ensures messages don't disappear when switching between WidgetDesktop and MinimizedWidgetContent.
 */
export const useMessagesStore = create<MessagesStore>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
}));
