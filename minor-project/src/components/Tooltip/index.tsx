import styled from "@emotion/styled";
import { ReactNode, ReactElement, useState, useRef, useEffect } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  title: ReactNode;
  position?: TooltipPosition;
  children: ReactElement;
  className?: string;
  disabled?: boolean;
  showOnHover?: boolean;
  visible?: boolean;
  enterDelay?: number;
}

// Position-based styles extracted as constants for performance
const TOOLTIP_POSITION_STYLES = {
  top: {
    bottom: "calc(100% + 12px)",
    left: "50%",
    transform: "translateX(-50%)",
  },
  bottom: {
    top: "calc(100% + 12px)",
    left: "50%",
    transform: "translateX(-50%)",
  },
  left: {
    right: "calc(100% + 12px)",
    top: "50%",
    transform: "translateY(-50%)",
  },
  right: {
    left: "calc(100% + 12px)",
    top: "50%",
    transform: "translateY(-50%)",
  },
} as const;

const TOOLTIP_ARROW_STYLES = {
  top: {
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    borderLeft: "8px solid transparent",
    borderRight: "8px solid transparent",
    borderTop: "8px solid rgba(25, 25, 30, 0.95)",
  },
  bottom: {
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    borderLeft: "8px solid transparent",
    borderRight: "8px solid transparent",
    borderBottom: "8px solid rgba(25, 25, 30, 0.95)",
  },
  left: {
    left: "100%",
    top: "50%",
    transform: "translateY(-50%)",
    borderTop: "8px solid transparent",
    borderBottom: "8px solid transparent",
    borderLeft: "8px solid rgba(25, 25, 30, 0.95)",
  },
  right: {
    right: "100%",
    top: "50%",
    transform: "translateY(-50%)",
    borderTop: "8px solid transparent",
    borderBottom: "8px solid transparent",
    borderRight: "8px solid rgba(25, 25, 30, 0.95)",
  },
} as const;

// Common static styles that never change
const TOOLTIP_BASE_STYLES = {
  position: "absolute" as const,
  padding: "12px 18px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: 500,
  whiteSpace: "nowrap" as const,
  zIndex: 1000,
  pointerEvents: "none" as const,

  // Dark Glass Effect
  background:
    "linear-gradient(135deg, rgba(30, 30, 35, 0.95), rgba(20, 20, 25, 0.98))",
  backdropFilter: "blur(24px) saturate(150%)",
  WebkitBackdropFilter: "blur(24px) saturate(150%)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  boxShadow: `
    0 12px 40px 0 rgba(0, 0, 0, 0.5),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
    0 4px 12px 0 rgba(0, 0, 0, 0.3)
  `,

  // Text styling
  color: "rgba(255, 255, 255, 0.95)",
  textShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",

  // Transition
  transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
} as const;

// Using transient prop ($visible) to prevent it from being passed to DOM
const TooltipContainer = styled.div<{
  position: TooltipPosition;
  $visible: boolean;
}>(({ position, $visible }) => ({
  ...TOOLTIP_BASE_STYLES,
  ...TOOLTIP_POSITION_STYLES[position],

  // Dynamic visibility - only these values change
  opacity: $visible ? 1 : 0,
  visibility: $visible ? ("visible" as const) : ("hidden" as const),

  // Arrow styling
  "&::after": {
    content: '""',
    position: "absolute",
    ...TOOLTIP_ARROW_STYLES[position],
    filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))",
  },

  // Shimmer effect
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)",
    animation: $visible ? "shimmer 2.5s infinite" : "none",
    borderRadius: "12px",
    opacity: $visible ? 1 : 0,
  },

  "@keyframes shimmer": {
    "0%": {
      left: "-100%",
    },
    "100%": {
      left: "200%",
    },
  },
}));

const Wrapper = styled.div({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

export function Tooltip({
  title,
  position = "top",
  children,
  className,
  disabled = false,
  showOnHover = true,
  visible: externalVisible,
  enterDelay = 500,
}: TooltipProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (showOnHover && !disabled && externalVisible === undefined) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setInternalVisible(true);
      }, enterDelay);
    }
  };

  const handleMouseLeave = () => {
    if (showOnHover && externalVisible === undefined) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setInternalVisible(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isVisible =
    externalVisible !== undefined ? externalVisible : internalVisible;

  return (
    <Wrapper onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {!disabled && (
        <TooltipContainer
          position={position}
          $visible={isVisible}
          className={className}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          {title}
        </TooltipContainer>
      )}
    </Wrapper>
  );
}

export default Tooltip;
