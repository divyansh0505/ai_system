import { useCallback, useEffect, useMemo, useRef } from "react";
import styled from "@emotion/styled";
import Message from "./components/Message";
import InputBar from "./components/InputBar";
import TranscriptHeaderBar from "./components/HeaderBar";
import Suggestions from "./components/Suggestions";
import MessageBubble from "./components/MessageBubble";

import useAutoScrollToBottom from "@/hooks/useAutoScrollToBottom";
import { useChat, useLocalParticipant } from "@livekit/components-react";
import { analytics } from "@/services/analytics";
import { useVoiceAssistant } from "@livekit/components-react";
import { useMessages } from "@/lib/livekit";
import { useStableAgentState } from "@/hooks/useStableAgentState";
import { useStore } from "@/store";
import { useWidgetStore } from "@/store/widgetStore";
import { useAssistantStore } from "@/store/assistantStore";
import { promptForEmail } from "@/services/agentRPC";
import { MESSAGE_BOX_WIDTH } from "@/utils/constants";

// Module-level flag to track if initial prompt has been handled (persists across remounts)
let initialPromptHandled = false;

interface TranscriptContainerProps {
  $isMinimized: boolean;
}

const TranscriptContainer = styled.div<TranscriptContainerProps>(
  ({ $isMinimized }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: `${MESSAGE_BOX_WIDTH}rem`,
    height: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: "16px",
    // Increase shadow in full mode, reduce or remove shadow in minimized mode
    boxShadow: $isMinimized
      ? "0 8px 24px -2px rgba(0,0,0,0.10), 0 2px 8px -2px rgba(0,0,0,0.06)"
      : "0 32px 64px -8px rgba(0,0,0,0.16), 0 12px 24px -6px rgba(0,0,0,0.10)",
  }),
);

const MessagesWrapper = styled.div({
  position: "relative",
  marginTop: 0,
  borderBottomLeftRadius: "16px",
  borderBottomRightRadius: "16px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "white",
  flex: 1,
  minHeight: 0,
});

const MessagesContainer = styled.div({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  color: "white",
  position: "relative",
  padding: "0.5rem",
  minHeight: 0,
  "& > :first-of-type": {
    marginTop: "20px",
  },
  // Custom scrollbar styling to remove visible track line
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  // Firefox scrollbar styling
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
});

const InputBarWrapper = styled.div({
  flexShrink: 0,
});

function Messages() {
  const chat = useChat();
  const messages = useMessages();
  const { state } = useVoiceAssistant();
  const stableListening = useStableAgentState(
    state,
    "listening",
    1500,
    messages.length,
  );
  const stableThinking = useStableAgentState(state, "thinking", 500);
  const { localParticipant } = useLocalParticipant();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);

  const messagesAutoScrollKey = useMemo(
    () =>
      (messages[messages.length - 1]?.message?.length || 0) + messages.length,
    [messages],
  );

  useAutoScrollToBottom(
    containerRef,
    [messagesAutoScrollKey, state, stableListening],
    200,
  );

  // Force scroll to bottom when display mode changes (maximize/minimize)
  // Use a delay to allow layout to settle after mode change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [widgetDisplayMode]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      try {
        await chat.send(message.trim());
        analytics.trackMessage("sent", message.trim());
      } catch (error) {
        console.error("Error sending message:", error);
        analytics.trackError(
          "message_send_failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
    [chat],
  );

  const initialQuestion = useStore((state) => state.initialQuestion);
  const agentVideoReady = useAssistantStore((state) => state.agentVideoReady);
  const emailSubmitted = useAssistantStore((state) => state.emailSubmitted);
  const setInitialQuestion = useStore((state) => state.setInitialQuestion);
  const widgetState = useWidgetStore((state) => state.widgetState);

  useEffect(() => {
    if (!agentVideoReady || initialPromptHandled) return;

    if (initialQuestion) {
      handleSendMessage(initialQuestion);
      setInitialQuestion(null);
      initialPromptHandled = true;
    } else if (!emailSubmitted) {
      promptForEmail();
      initialPromptHandled = true;
    }
  }, [initialQuestion, agentVideoReady, emailSubmitted]);

  const isMinimized = widgetDisplayMode === "minimized";

  return (
    <TranscriptContainer $isMinimized={isMinimized}>
      <TranscriptHeaderBar />
      <MessagesWrapper>
        <MessagesContainer ref={containerRef}>
          {messages.map((item, index) => (
            <Message
              key={index}
              message={item}
              isSent={item.from?.identity === localParticipant?.identity}
              isLastMessage={index === messages.length - 1}
              isAgentSpeaking={state === "speaking"}
              index={index}
            />
          ))}
          {stableThinking ? (
            <MessageBubble type="received" isThinking={true} />
          ) : null}
          {stableListening && (
            <Suggestions onSuggestionClick={handleSendMessage} />
          )}
        </MessagesContainer>
        <InputBarWrapper>
          <InputBar
            disabled={widgetState !== "active"}
            placeholder={
              widgetState !== "active"
                ? "Please enter your email to continue"
                : "Type your message..."
            }
            onSubmit={handleSendMessage}
          />
        </InputBarWrapper>
      </MessagesWrapper>
    </TranscriptContainer>
  );
}

export default Messages;
