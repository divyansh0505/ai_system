import * as React from "react";
import styled from "@emotion/styled";
import { MessageCircle } from "lucide-react";
import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { talkToHumanClicked } from "@/services/agentRPC";
import { analytics } from "@/services/analytics";
import Button from "@/components/ui/Button";

interface TalkToHumanButtonProps {
  variant?: "mobile" | "desktop";
  onSuccess?: () => void;
  className?: string;
}

// Desktop button styling (for WidgetControl)
const DesktopButton = styled(Button)({
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.65) 100%)",
  color: "#2563eb",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  borderRadius: "12px",
  paddingLeft: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
  transition: "all 0.2s ease",
  position: "relative",
  overflow: "hidden",
  opacity: 1,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)",
    pointerEvents: "none",
  },
  "&:hover:not(:disabled)": {
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    opacity: 1,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
    transform: "translateY(-1px)",
  },
  "&:active:not(:disabled)": {
    transform: "translateY(0)",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
  },
  "&:disabled": {
    opacity: 1,
    cursor: "not-allowed",
    pointerEvents: "auto",
  },
});

// Mobile button styling (for MobileControlPanel)
const MobileButton = styled(Button)({
  width: "100%",
  maxWidth: "280px",
  background:
    "linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(29, 78, 216, 0.9) 100%)",
  color: "white",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: "12px",
  padding: "0.875rem 1.5rem",
  fontSize: "1rem",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  boxShadow:
    "0 4px 6px -1px rgba(37, 99, 235, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  transition: "all 0.2s ease",
  "&:hover:not(:disabled)": {
    background:
      "linear-gradient(135deg, rgba(37, 99, 235, 1) 0%, rgba(29, 78, 216, 1) 100%)",
    transform: "translateY(-1px)",
    boxShadow:
      "0 10px 15px -3px rgba(37, 99, 235, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  "&:active:not(:disabled)": {
    transform: "translateY(0)",
  },
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
});

export function TalkToHumanButton({
  variant = "desktop",
  onSuccess,
  className,
}: TalkToHumanButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const setContentMode = useAssistantStore((state) => state.setContentMode);
  const setPreloadedMode = useAssistantStore((state) => state.setPreloadedMode);

  const handleClick = async () => {
    analytics.track("talk_to_human_clicked");
    setIsLoading(true);
    try {
      setPreloadedMode(ContentMode.CALENDAR);
      await talkToHumanClicked();
      setContentMode(ContentMode.CALENDAR);
      onSuccess?.(); // Call optional success callback (e.g., close sidebar)
    } catch (error) {
      setContentMode(ContentMode.DEMO);
      console.error("Error talking to human:", error);
      analytics.trackError(
        "talk_to_human_failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ButtonComponent = variant === "mobile" ? MobileButton : DesktopButton;

  return (
    <ButtonComponent
      onClick={handleClick}
      icon={MessageCircle}
      aria-label="Talk to a human"
      isLoading={isLoading}
      className={className}
    >
      Talk to a human
    </ButtonComponent>
  );
}

export default TalkToHumanButton;
