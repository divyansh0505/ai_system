import * as React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { theme } from "@/styles/theme";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import { useWidgetStore } from "@/store/widgetStore";

type TextBubbleType = "sent" | "received";

export interface TextBubbleProps {
  message?: string;
  type: TextBubbleType;
  timestamp?: number;
  className?: string;
  isThinking?: boolean;
  shouldAnimate?: boolean;
  typingSpeed?: number;
}

const sentBubbleStyles = {
  alignSelf: "flex-end",
  borderRadius: "16px 0px 16px 16px",
  color: "#000000",
  backgroundColor: "#E5ECFF",
  backgroundBlendMode: "luminosity",
  backdropFilter: "blur(56px)",
  WebkitBackdropFilter: "blur(56px)",
  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
};

const receivedBubbleStyles = {
  alignSelf: "flex-start",
  borderRadius: "0px 16px 16px 16px",
  background: theme.colors.surface,
  color: "#000000",
  backgroundBlendMode: "luminosity",
  backdropFilter: "blur(56px)",
  WebkitBackdropFilter: "blur(56px)",
  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
};

const MessageContainer = styled.div<{ type: TextBubbleType, $isMinimized: boolean }>((props) => ({
  display: "grid",
  gridTemplateColumns: props.type === "sent" ? "1fr auto" : "auto 1fr",
  gridTemplateRows: "auto auto auto",
  gap: props.$isMinimized ? "0 6px" : "0 12px",
  alignItems: "start",
  alignSelf: props.type === "sent" ? "flex-end" : "flex-start",
  maxWidth: props.$isMinimized ? "85%" : "90%",
  width: "fit-content",
  justifySelf: props.type === "sent" ? "flex-end" : "flex-start",
}));

const BaseBubble = styled.div({
  position: "relative",
  minWidth: "120px",
  width: "fit-content",
  flex: "0 0 auto",
  padding: "12px 16px",
  margin: "4px 0",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",

  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    opacity: 0.8,
    transition: "opacity 0.2s ease",
  },

  "&::after": {
    content: '""',
    position: "absolute",
    top: "1px",
    left: "1px",
    right: "1px",
    bottom: "1px",
    borderRadius: "inherit",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)",
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.2s ease",
    zIndex: 1,
  },
});

const MessageText = styled.p<{ $isMinimized: boolean }>(({ $isMinimized }) => ({
  margin: 0,
  lineHeight: "1.4",
  fontWeight: 400,
  position: "relative",
  zIndex: 2,
  wordWrap: "break-word",
  whiteSpace: "pre-wrap",
  fontSize: $isMinimized ? "12px" : "13px",
}));

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const ThinkingDots = styled.div({
  display: "flex",
  alignItems: "baseline",
  gap: 0,
  padding: "4px 0",
});

const ThinkingText = styled.span({
  fontSize: "13px",
  fontStyle: "italic",
  lineHeight: "1.4",
  marginRight: "2px",
});

const Dot = styled.span<{ delay: string }>(({ delay }) => ({
  fontSize: "13px",
  fontStyle: "italic",
  lineHeight: "1.4",
  animation: `${pulse} 1.4s infinite ease-in-out`,
  animationDelay: delay,
}));

function BubbleContainer({
  type,
  children,
}: {
  type: TextBubbleType;
  children: React.ReactNode;
}) {
  const bubbleStyles =
    type === "sent" ? sentBubbleStyles : receivedBubbleStyles;
  return (
    <BaseBubble
      css={{
        ...bubbleStyles,
        gridColumn: type === "sent" ? "1" : "2",
        gridRow: "2",
        width: "fit-content",
        padding: "8px 12px",
        justifySelf: type === "sent" ? "flex-end" : "flex-start",
      }}
    >
      {children}
    </BaseBubble>
  );
}

const MessageBubble: React.FC<TextBubbleProps> = ({
  message,
  type,
  isThinking,
  shouldAnimate = false,
  typingSpeed = 40,
}) => {
  const animatedText = useTypingEffect({
    text: message,
    enabled: shouldAnimate && !isThinking,
    speed: typingSpeed,
  });

  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);
  const displayText = shouldAnimate ? animatedText : message;

  return (
    <MessageContainer type={type} $isMinimized={widgetDisplayMode === "minimized"}>
      <BubbleContainer type={type}>
        {isThinking ? (
          <ThinkingDots>
            <ThinkingText>Thinking</ThinkingText>
            <Dot delay="0s">.</Dot>
            <Dot delay="0.2s">.</Dot>
            <Dot delay="0.4s">.</Dot>
          </ThinkingDots>
        ) : (
          <MessageText $isMinimized={widgetDisplayMode === "minimized"}>{displayText}</MessageText>
        )}
      </BubbleContainer>
    </MessageContainer>
  );
};

export default React.memo(MessageBubble);
