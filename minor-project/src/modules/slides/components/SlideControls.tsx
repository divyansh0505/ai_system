import * as React from "react";
import styled from "@emotion/styled";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useAssistantStore } from "@/store/assistantStore";
import { setPresentationState as setAgentPresentationState } from "@/services/agentRPC";

interface SlideControlsProps {
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  isPresentationMode?: boolean;
}

const ControlsContainer = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "8px",
  zIndex: 10,
  background: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1.2px solid rgba(255, 255, 255, 0.5)",
  borderRadius: "62px",
  boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.12)",
});

const ControlButton = styled.button<{
  disabled?: boolean;
  isPrimary?: boolean;
}>(({ disabled, isPrimary }) => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  border: isPrimary ? "none" : "1px solid rgba(244, 244, 245, 1)",
  background: isPrimary ? "#2B5CE3" : "rgba(255, 255, 255, 1)",
  color: disabled
    ? isPrimary
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.3)"
    : isPrimary
      ? "#fff"
      : "rgba(0, 0, 0, 0.87)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.2s ease",
  opacity: disabled ? 0.5 : 1,
  pointerEvents: disabled ? "none" : "auto",
  "&:hover": disabled
    ? {}
    : isPrimary
      ? {
          background: "#1E47C9",
          transform: "scale(1.05)",
        }
      : {
          background: "rgba(255, 255, 255, 0.9)",
          transform: "scale(1.05)",
        },
  "&:active": disabled
    ? {}
    : {
        transform: "scale(0.95)",
      },
}));

function SlideControls({
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
  isPresentationMode = false,
}: SlideControlsProps) {
  const presentationState = useAssistantStore(
    (state) => state.presentationState,
  );
  const setPresentationState = useAssistantStore(
    (state) => state.setPresentationState,
  );

  const handlePlayPauseToggle = async () => {
    const newState = presentationState === "play" ? "pause" : "play";
    setPresentationState(newState);

    // Send RPC call to agent
    await setAgentPresentationState(newState);
  };

  return (
    <ControlsContainer>
      <ControlButton
        onClick={onPrev}
        disabled={disablePrev}
        aria-label="Previous slide"
      >
        <ArrowLeft size={20} />
      </ControlButton>
      {!isPresentationMode && (
        <ControlButton
          isPrimary
          onClick={handlePlayPauseToggle}
          aria-label={
            presentationState === "play"
              ? "Pause presentation"
              : "Play presentation"
          }
        >
          {presentationState === "play" ? (
            <Pause fill="#ffffff" size={20} />
          ) : (
            <Play fill="#ffffff" size={20} />
          )}
        </ControlButton>
      )}
      <ControlButton
        onClick={onNext}
        disabled={disableNext}
        aria-label="Next slide"
      >
        <ArrowRight size={20} />
      </ControlButton>
    </ControlsContainer>
  );
}

export default React.memo(SlideControls);
