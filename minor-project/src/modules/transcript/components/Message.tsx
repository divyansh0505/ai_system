import * as React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import MessageBubble from "./MessageBubble";

// Entrance animation: fade in + slide up from bottom
const slideUpFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const MessageWrapper = styled.div({
  animation: `${slideUpFadeIn} 0.4s ease-out forwards`,
});

function Message({
  message,
  index,
  isSent,
  isLastMessage,
  isAgentSpeaking,
}: {
  message: { message: string };
  index: number;
  isSent: boolean;
  isLastMessage: boolean;
  isAgentSpeaking: boolean;
}) {
  // Animate only the last received message when the agent is actively speaking
  const shouldAnimate = isLastMessage && !isSent && isAgentSpeaking;

  return (
    <MessageWrapper>
      <MessageBubble
        key={index}
        type={isSent ? "sent" : "received"}
        message={message.message}
        shouldAnimate={shouldAnimate}
        typingSpeed={100}
      />
    </MessageWrapper>
  );
}

export default React.memo(Message);
