import * as React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

interface AnimatedQuestionProps {
  questions: string[];
  displayDuration?: number;
  className?: string;
}

const slideOutUp = keyframes`
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-100%);
    opacity: 0;
  }
`;

const slideInUp = keyframes`
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const MessageBubble = styled.div({
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  borderRadius: "18px",
  padding: "0px 16px",
  boxShadow: "0px 0px 8px 0px rgba(79, 79, 79, 0.08)",
  alignSelf: "stretch",
  flexShrink: 0,
  minHeight: "36px",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  position: "relative",
});

const QuestionContainer = styled.div({
  position: "relative",
  width: "100%",
  minHeight: "20px",
});

const MessageText = styled.p<{ state: "current" | "exiting" | "entering" }>(
  ({ state }) => ({
    fontFamily: "'SF Pro Display', 'SF Pro', sans-serif",
    fontWeight: 510,
    fontSize: "16px",
    color: "#27272a",
    margin: 0,
    whiteSpace: "normal",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    position: state === "current" ? "relative" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    willChange: "transform, opacity",
    animation:
      state === "exiting"
        ? `${slideOutUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards`
        : state === "entering"
          ? `${slideInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards`
          : "none",
  }),
);

const AnimatedQuestion: React.FC<AnimatedQuestionProps> = ({
  questions,
  displayDuration = 1000,
  className,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [nextQuestionIndex, setNextQuestionIndex] = React.useState<
    number | null
  >(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (questions.length <= 1) return;

    const intervalId = setInterval(() => {
      const nextIndex = (currentQuestionIndex + 1) % questions.length;
      setNextQuestionIndex(nextIndex);
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentQuestionIndex(nextIndex);
        setIsTransitioning(false);
        setNextQuestionIndex(null);
      }, 600); // Match animation duration
    }, displayDuration);

    return () => clearInterval(intervalId);
  }, [questions.length, displayDuration, currentQuestionIndex]);

  if (questions.length === 0) return null;

  return (
    <MessageBubble className={className}>
      <QuestionContainer>
        <MessageText state={isTransitioning ? "exiting" : "current"}>
          {questions[currentQuestionIndex]}
        </MessageText>
        {nextQuestionIndex !== null && isTransitioning && (
          <MessageText state="entering">
            {questions[nextQuestionIndex]}
          </MessageText>
        )}
      </QuestionContainer>
    </MessageBubble>
  );
};

export default React.memo(AnimatedQuestion);
