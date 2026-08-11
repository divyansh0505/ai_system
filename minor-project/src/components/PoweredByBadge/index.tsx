import * as React from "react";
import styled from "@emotion/styled";
import InteractnowLogo from "/public/images/logo.svg";

type BadgeVariant = "small" | "large";

interface PoweredByBadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

const BadgeContainer = styled.a<{ variant: BadgeVariant }>(({ variant }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: variant === "small" ? "0.25rem" : "6px",
  padding: variant === "small" ? "0.5rem 0.75rem" : "12px 16px",
  background: "rgba(43, 92, 227, 0.9)",
  borderRadius: variant === "small" ? "6px" : "12px",
  border: "1px solid rgba(255, 255, 255, 0.75)",
  boxShadow:
    "0px 4px 4px 0px rgba(0, 0, 0, 0.12), 0px 4px 12px 0px rgba(0, 0, 0, 0.11)",
  textDecoration: "none",
  cursor: "pointer",
  transition: "background 0.2s ease",
  "&:hover": {
    background: "rgba(43, 92, 227, 1)",
  },
}));

const BadgeText = styled.p<{ variant: BadgeVariant }>(({ variant }) => ({
  fontFamily: "'SF Pro Display', sans-serif",
  fontWeight: 510,
  fontSize: variant === "small" ? "6px" : "10px",
  lineHeight: 1,
  color: "white",
  margin: 0,
  whiteSpace: "nowrap",
  letterSpacing: "0.5px",
}));

function PoweredByBadge({ variant = "large", className }: PoweredByBadgeProps) {
  const logoSize =
    variant === "small" ? { width: 58, height: 12 } : { width: 69, height: 16 };

  return (
    <BadgeContainer
      href="https://interactlabs.ai/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by InteractAI"
      variant={variant}
      className={className}
    >
      <BadgeText variant={variant}>POWERED BY</BadgeText>
      <img
        src={InteractnowLogo}
        alt="InteractNOW"
        width={logoSize.width}
        height={logoSize.height}
        style={{ display: "block" }}
      />
    </BadgeContainer>
  );
}

export default React.memo(PoweredByBadge);
