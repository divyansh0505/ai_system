import * as React from "react";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

const Row = styled(motion.div)({
  display: "grid",
  gridTemplateColumns: "50px 1fr",
  alignItems: "center",
  gap: "10px",
  width: "100%",
});

const Bubble = styled(motion.div)<{ $error?: boolean }>(
  ({ theme, $error }) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "15px",
    lineHeight: 1.6,
    background: $error ? "#FFF1F2" : "#fff",
    border: $error ? "1px solid #FECDD3" : "none",
    color: $error ? theme.colors.destructive : theme.colors.text,
    boxShadow: $error
      ? "0 2px 10px 0 rgba(225,29,72,0.08)"
      : "0 2px 10px 0 rgba(0,0,0,0.07)",
    textAlign: "left",
    whiteSpace: "pre-line",
    width: "fit-content",
    maxWidth: "100%",
  })
);

const IconWrap = styled.span<{ $error?: boolean }>(({ theme, $error }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  background: $error ? "#FFF1F2" : "#E5ECFF",
  color: $error ? theme.colors.destructive : theme.colors.primary,
  borderRadius: "8px",
  flexShrink: 0,
}));

const typingDotKeyframes = keyframes`
  0%, 60%, 100% { transform: scale(0.7); opacity: 0.35; }
  30%           { transform: scale(1);   opacity: 1;    }
`;

const TypingDot = styled.span({
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: "#2B5CE3",
  animation: `${typingDotKeyframes} 1.1s infinite ease-in-out`,
  "&:nth-of-type(2)": { animationDelay: "0.18s" },
  "&:nth-of-type(3)": { animationDelay: "0.36s" },
});

interface AgentMessageProps {
  showAvatar?: boolean;
  avatarSrc?: string;
  avatarAlt?: string;
  state: "typing" | "visible";
  icon?: LucideIcon | null;
  error?: boolean;
  children?: React.ReactNode;
  rowDelay?: number;
}

const rowSpring = { type: "spring", stiffness: 280, damping: 26 } as const;
const bubbleSpring = { type: "spring", stiffness: 320, damping: 24 } as const;

const AgentMessageBubble: React.FC<AgentMessageProps> = ({
  showAvatar = false,
  avatarSrc,
  avatarAlt = "Agent avatar",
  state,
  icon: Icon,
  error = false,
  children,
  rowDelay = 0,
}) => (
  <Row
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...rowSpring, delay: rowDelay }}
  >
    {showAvatar ? (
      <Avatar src={avatarSrc} alt={avatarAlt} />
    ) : (
      <div />
    )}

    <AnimatePresence mode="wait">
      {state === "typing" ? (
        <Bubble
          key="typing"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.13 } }}
          transition={{ delay: 0.2, duration: 0.22, ease: "easeOut" }}
          $error={error}
        >
          <TypingDot />
          <TypingDot />
          <TypingDot />
        </Bubble>
      ) : (
        <Bubble
          key="message"
          layout
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={bubbleSpring}
          $error={error}
        >
          {Icon && (
            <IconWrap $error={error}>
              <Icon size={16} />
            </IconWrap>
          )}
          {children}
        </Bubble>
      )}
    </AnimatePresence>
  </Row>
);

export default AgentMessageBubble;
