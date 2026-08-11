import * as React from "react";
import styled from "@emotion/styled";
import { ArrowRightIcon } from "lucide-react";
import { keyframes } from "@emotion/react";

interface CTAButtonProps {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const gradientRotation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledButton = styled.button({
  fontFamily:
    "SFProMedium, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontSize: "1.25rem",
  fontWeight: 500,
  color: "#ffffff",
  background: "transparent",
  border: "none",
  borderRadius: "16px",
  padding: "16px 32px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  width: "fit-content",
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: "-200%",
    background:
      "conic-gradient(from 0deg, #DA7BFF, #D7FF5D, #68FFC8, #61EEFF, #DA7BFF)",
    animation: `${gradientRotation} 4s linear infinite`,
    zIndex: -2,
  },
  "&::after": {
    content: '""',
    position: "absolute",
    inset: "1.5px",
    borderRadius: "16px",
    background: "#000000",
    zIndex: -1,
  },
  "&:hover": {
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
});

const CTAButton: React.FC<CTAButtonProps> = ({
  onClick,
  children = "Ask Maya anything",
  className,
  type = "button",
}) => {
  return (
    <StyledButton onClick={onClick} type={type} className={className}>
      {children}
      <ArrowRightIcon size={16} css={{ marginLeft: "8px" }} />
    </StyledButton>
  );
};

export default React.memo(CTAButton);
