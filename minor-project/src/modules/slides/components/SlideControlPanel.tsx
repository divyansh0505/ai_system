import * as React from "react";
import styled from "@emotion/styled";
import {
  useVoiceAssistant,
  useLocalParticipant,
} from "@livekit/components-react";
import { useAssistantStore } from "@/store/assistantStore";
import { setPresentationState as setAgentPresentationState } from "@/services/agentRPC";

import {
  PanelRight,
  Presentation,
  Pause,
  Play,
  MicOff,
  Mic,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import VideoCard from "@/components/VideoCard";
import PoweredByBadgeComponent from "@/components/PoweredByBadge";
import speakingVideo from "/video/speaking.webm";

interface SlideControlPanelProps {
  currentSlide: number;
  totalSlides: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onTogglePanel: () => void;
  onGoToSlide: () => void;
}

const PanelContainer = styled.div({
  flex: 1,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  backgroundColor: "#fff",
  overflow: "hidden",
  position: "relative",
});

const HeaderButton = styled.button({
  position: "absolute",
  left: "0.5rem",
  top: "0.5rem",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.5rem",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  pointerEvents: "auto",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 100%)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    transform: "translateY(-1px)",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
});

const VideoSection = styled.div({
  flex: 1,
  maxHeight: "240px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "0.75rem",
  padding: "0",
  minHeight: 0,
});

const VideoContainer = styled.div({
  width: "100%",
  height: "100%",
  position: "relative",
});

const ControlsRow = styled.div({
  display: "flex",
  gap: "0.75rem",
  alignItems: "flex-start",
});

const ControlButton = styled.button({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5rem",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});

const Divider = styled.div({
  width: "1px",
  height: "18px",
  backgroundColor: "#E4E4E7",
});

const NavigationSection = styled.div({
  height: 110,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
});

const GoToSlideContainer = styled.div({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.6rem",
  
});

const GoToSlideButton = styled.button({
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.3rem",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontFamily: "'SF Pro Display', sans-serif",
  fontWeight: 600,
  color: "#2B5CE3",
  transition: "all 0.2s ease",
  "&:hover": {
    opacity: 0.7,
  },
});

const NavigationControls = styled.div({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "90%",
  padding: "0.5rem 0",
});

const NavButton = styled.button({
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  backgroundColor: "#EEF2FF",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#E0E7FF",
  },
  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

const SlideCounter = styled.p({
  fontFamily: "'SF Pro Display', sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  color: "#3F3F46",
  margin: 0,
});

// Reusable icon button component with shadcn-like variants
interface SlideControlIconButtonProps {
  variant?: "default" | "destructive" | "primary";
  onClick?: () => void;
  children: React.ReactNode;
  label: string;
}

const ControlIconWrapper = styled.div<{
  variant: "default" | "destructive" | "primary";
}>(({ variant }) => {
  const getBackgroundColor = () => {
    if (variant === "destructive") return "#FF3B30";
    if (variant === "primary") return "#2B5CE3";
    return "#EEF2FF";
  };

  const getColor = () => {
    if (variant === "destructive" || variant === "primary") return "#FFFFFF";
    return "#2B5CE3";
  };

  const getHoverBackgroundColor = () => {
    if (variant === "destructive") return "#FEF2F2";
    if (variant === "primary") return "#1e4bc7";
    return "#EFF6FF";
  };

  return {
    minWidth: "48px",
    minHeight: "48px",
    borderRadius: "50%",
    backgroundColor: getBackgroundColor(),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: getColor(),
    transition: "background-color 0.15s ease-in-out",
    "&:hover": {
      backgroundColor: getHoverBackgroundColor(),
    },
    "& svg": {
      width: "22px",
      height: "22px",
      flexShrink: 0,
    },
  };
});

function SlideControlIconButton({
  variant = "default",
  onClick,
  children,
  label,
}: SlideControlIconButtonProps) {
  return (
    <ControlButton onClick={onClick}>
      <ControlIconWrapper variant={variant}>{children}</ControlIconWrapper>
      <ControlLabel>{label}</ControlLabel>
    </ControlButton>
  );
}

const ControlLabel = styled.p({
  fontFamily: "'SF Pro Display', sans-serif",
  fontSize: "0.8rem",
  color: "#52525B",
  margin: 0,
  textAlign: "center",
});

const Footer = styled.div({
  padding: "0.5rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

function SlideControlPanel({
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onTogglePanel,
  onGoToSlide,
}: SlideControlPanelProps) {
  const { videoTrack: agentVideoTrack } = useVoiceAssistant();
  const presentationState = useAssistantStore(
    (state) => state.presentationState,
  );
  const setPresentationState = useAssistantStore(
    (state) => state.setPresentationState,
  );

  const handleTogglePresentationState = async () => {
    const newState = presentationState === "play" ? "pause" : "play";
    setPresentationState(newState);
    await setAgentPresentationState(newState);
  };

  const { localParticipant } = useLocalParticipant();
  const isMicMuted = !localParticipant.isMicrophoneEnabled;

  const handleMicToggle = async () => {
    await localParticipant.setMicrophoneEnabled(isMicMuted);
  };

  return (
    <PanelContainer>
      {/* Header: Panel toggle + Exit */}
      <HeaderButton onClick={onTogglePanel}>
        <PanelRight size={22} />
      </HeaderButton>

      {/* Video & Controls Section */}
      <VideoSection>
        <VideoContainer>
          <VideoCard
            videoTrack={agentVideoTrack}
            staticVideoSrc={speakingVideo}
            css={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
            }}
            loop={true}
            width="100%"
            height="100%"
          />
        </VideoContainer>

        <ControlsRow>
          <SlideControlIconButton
            variant={presentationState !== "play" ? "primary" : "default"}
            onClick={handleTogglePresentationState}
            label={presentationState === "play" ? "Pause" : "Resume"}
          >
            {presentationState === "play" ? (
              <Pause fill="#2B5CE3" size={22} />
            ) : (
              <Play fill="#FFFFFF" size={22} />
            )}
          </SlideControlIconButton>

          <SlideControlIconButton
            variant={isMicMuted ? "destructive" : "default"}
            onClick={handleMicToggle}
            label={isMicMuted ? "Unmute" : "Mute"}
          >
            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </SlideControlIconButton>
        </ControlsRow>
      </VideoSection>

      {/* Navigation Section */}
      <NavigationSection>
        <NavigationControls>
          <NavButton onClick={onPrevSlide} disabled={currentSlide === 0}>
            <ChevronLeft size={20} color="#4F46E5" />
          </NavButton>
          <SlideCounter>
            {currentSlide + 1}/{totalSlides}
          </SlideCounter>
          <NavButton
            onClick={onNextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight size={20} color="#4F46E5" />
          </NavButton>
        </NavigationControls>
        <GoToSlideContainer>
          <Divider
            style={{
              width: "100%",
              height: "0.5px",
            }}
          />

          <GoToSlideButton onClick={onGoToSlide}>
            <Presentation size={14} />
            Go to slide
          </GoToSlideButton>

          <Divider style={{ width: "100%", height: "1px" }} />
        </GoToSlideContainer>
        {/* Footer: Powered by */}
        <Footer>
          <PoweredByBadgeComponent variant="small" />
        </Footer>
      </NavigationSection>
    </PanelContainer>
  );
}

export default React.memo(SlideControlPanel);
