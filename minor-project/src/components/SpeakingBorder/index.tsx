import * as React from "react";
import styled from "@emotion/styled";

const SpeakingBorderWrapper = styled.div({
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: "1rem",
  transform: "translateZ(0)",
  backfaceVisibility: "hidden",
  perspective: 1000,
});

const BorderSide = styled.div({
  position: "absolute",
  borderRadius: "inherit",
  pointerEvents: "none",
});

const Border = styled(BorderSide, {
  shouldForwardProp: (prop) => prop !== "isVisible",
})<{
  direction: "top" | "bottom" | "left" | "right";
  isVisible: boolean;
}>(({ direction, isVisible }) => {
  let specific = {};
  let gradient = "";

  switch (direction) {
    case "top":
      specific = { top: 0, left: 0, right: 0, height: "24px" };
      gradient =
        "linear-gradient(to bottom, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0))";
      break;
    case "bottom":
      specific = { bottom: 0, left: 0, right: 0, height: "24px" };
      gradient =
        "linear-gradient(to top, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0))";
      break;
    case "left":
      specific = { top: 0, bottom: 0, left: 0, width: "24px" };
      gradient =
        "linear-gradient(to right, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0))";
      break;
    case "right":
      specific = { top: 0, bottom: 0, right: 0, width: "24px" };
      gradient =
        "linear-gradient(to left, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0))";
      break;
    default:
      break;
  }
  return {
    ...specific,
    background: gradient,
    opacity: isVisible ? 1 : 0,
    animation: isVisible ? "ping 2s ease-in-out infinite" : "none",
    zIndex: 10,
    transition: "opacity 0.3s ease-out",
    willChange: isVisible ? "opacity" : "auto",
    backfaceVisibility: "hidden",
    perspective: 1000,
    "@keyframes ping": {
      "0%, 100%": {
        opacity: 0.4,
      },
      "50%": {
        opacity: 0.8,
      },
    },
  };
});

interface SpeakingBorderProps {
  isVisible: boolean;
  children: React.ReactNode;
}

const SpeakingBorder = ({ isVisible, children }: SpeakingBorderProps) => (
  <SpeakingBorderWrapper>
    {children}
    <Border direction="top" className="border" isVisible={isVisible} />
    <Border direction="bottom" className="border" isVisible={isVisible} />
    <Border direction="left" className="border" isVisible={isVisible} />
    <Border direction="right" className="border" isVisible={isVisible} />
  </SpeakingBorderWrapper>
);

export default SpeakingBorder;
