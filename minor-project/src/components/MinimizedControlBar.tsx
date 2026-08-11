import * as React from "react";
import styled from "@emotion/styled";
import { User, Maximize2, X } from "lucide-react";
import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { talkToHumanClicked } from "@/services/agentRPC";
import { analytics } from "@/services/analytics";

const ControlBarContainer = styled.div({
  display: "flex",
  gap: "8px",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  flexShrink: 0,
});

const ControlBarButton = styled.button({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "3px",
  borderRadius: "100px",
  background: "#fff",
  boxShadow:
    "0 2px 8px 0 rgba(0,0,0,0.10), 0 1.5px 5px 0 rgba(0,0,0,0.09)", // slightly darker shadow for visibility
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    background: "#fff",
    transform: "scale(1.05)",
    boxShadow:
      "0 4px 24px 0 rgba(0,0,0,0.15), 0 3px 10px 0 rgba(0,0,0,0.11)", // more prominent on hover
  },
  "&:active": {
    transform: "scale(0.98)",
    boxShadow:
      "0 1.5px 5px 0 rgba(0,0,0,0.11)", // slightly reduced on press
  },
  "&:disabled": {
    opacity: 0.7,
    cursor: "not-allowed",
  },
});

const TalkToHumanContent = styled.div({
  display: "flex",
  gap: "4px",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: "100px",
});

const TalkToHumanText = styled.span({
  fontFamily: "SFPro, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 590,
  fontSize: "12px",
  lineHeight: 1.4,
  color: "black",
});

const IconButton = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
  borderRadius: "100px",
});

interface MinimizedControlBarProps {
  onMaximize: () => void;
  onClose: () => void;
}

function MinimizedControlBar({
  onMaximize,
  onClose,
}: MinimizedControlBarProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const setContentMode = useAssistantStore((state) => state.setContentMode);
  const setPreloadedMode = useAssistantStore((state) => state.setPreloadedMode);

  const handleTalkToHuman = async () => {
    analytics.track("talk_to_human_clicked_minimized");
    setIsLoading(true);
    try {
      setPreloadedMode(ContentMode.CALENDAR);
      await talkToHumanClicked();
      setContentMode(ContentMode.CALENDAR);
      onMaximize();
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

  const handleMaximize = () => {
    analytics.track("maximize_clicked");
    onMaximize();
  };

  const handleClose = () => {
    analytics.track("minimized_exit_clicked");
    onClose();
  };

  return (
    <ControlBarContainer>
      {/* Talk to human button */}
      <ControlBarButton
        onClick={handleTalkToHuman}
        disabled={isLoading}
        aria-label="Talk to human"
      >
        <TalkToHumanContent>
          <User size={18} color="black" strokeWidth={2} />
          <TalkToHumanText>Talk to human</TalkToHumanText>
        </TalkToHumanContent>
      </ControlBarButton>

      {/* Maximize button */}
      <ControlBarButton onClick={handleMaximize} aria-label="Maximize">
        <IconButton>
          <Maximize2 size={18} color="black" strokeWidth={2} />
        </IconButton>
      </ControlBarButton>

      {/* Close button */}
      <ControlBarButton onClick={handleClose} aria-label="Close">
        <IconButton>
          <X size={18} color="black" strokeWidth={2} />
        </IconButton>
      </ControlBarButton>
    </ControlBarContainer>
  );
}

export default React.memo(MinimizedControlBar);
