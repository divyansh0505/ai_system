import { useMemo, useEffect } from "react";
import {
  type ReceivedChatMessage,
  type TextStreamData,
  useChat,
  useRoomContext,
  useTranscriptions,
} from "@livekit/components-react";
import { transcriptionToChatMessage } from "../utils.ts";
import { useMessagesStore } from "@/store/messagesStore";

/**
 * Merges live transcription messages with chat messages and persists them in a store.
 * This ensures messages are preserved during component unmount/remount cycles (e.g., minimize/maximize).
 */
export default function useMessages() {
  const transcriptions: TextStreamData[] = useTranscriptions();
  const chat = useChat();
  const room = useRoomContext();
  const { messages: storedMessages, setMessages } = useMessagesStore();

  // Merge current LiveKit messages with transcriptions
  const mergedMessages = useMemo(() => {
    const merged: Array<ReceivedChatMessage> = [
      ...transcriptions.map((transcription) =>
        transcriptionToChatMessage(transcription, room),
      ),
      ...chat.chatMessages,
    ];
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [transcriptions, chat.chatMessages, room]);

  // Sync merged messages to store only when we have more data
  // This prevents overwriting with empty/partial arrays during component remount
  useEffect(() => {
    if (
      mergedMessages.length > 0 &&
      mergedMessages.length >= storedMessages.length
    ) {
      setMessages(mergedMessages);
    }
  }, [mergedMessages, storedMessages.length, setMessages]);

  // Always return stored messages (single source of truth)
  return storedMessages;
}
