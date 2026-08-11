import * as React from "react";
import styled from "@emotion/styled";
import { useVoiceAssistant } from "@livekit/components-react";

import { useWidgetStore } from "@/store/widgetStore";

import VideoCard from "@/components/VideoCard";
import AudioControlsPill from "@/components/AudioControlsPill";

import movementVideo from "/video/movement.webm";
import speakingVideo from "/video/speaking.webm";

// Container for VideoCard + controls
const HeaderContainer = styled.div({
  position: "relative",
  width: "100%",
  flexShrink: 0,
});

const VideoWrapper = styled.div({
  position: "relative",
  width: "100%",
  height: "200px",
  overflow: "hidden",
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
});

const VideoControlsWrapper = styled.div({
  position: "absolute",
  bottom: "-36px",
  left: 0,
  width: "100%",
  height: "80px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background:
    "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #ffffff 40%, #ffffff 60%, rgba(255, 255, 255, 0) 100%)",
  zIndex: 10,
  pointerEvents: "none",
});

function TranscriptHeaderBar() {
  const widgetState = useWidgetStore((store) => store.widgetState);
  const isActive = widgetState === "active";

  const { state, videoTrack: agentVideoTrack } = useVoiceAssistant();

  const isSpeaking = state === "speaking";

  // Determine video source based on state
  // This is used as fallback when LiveKit video track is not available
  const videoSrc = isSpeaking ? speakingVideo : movementVideo;

  // Always render VideoCard with the LiveKit video track when available
  // The VideoCard component will use the LiveKit track if valid, otherwise fallback to static video
  // Only show AudioControlsPill when widget is active (user has completed onboarding)
  return (
    <HeaderContainer>
      <VideoWrapper>
        <VideoCard
          videoTrack={agentVideoTrack}
          staticVideoSrc={videoSrc}
          loop={true}
          width="100%"
          height="100%"
          css={{
            background: "rgba(255, 255, 255, 0.95)",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        />
      </VideoWrapper>
      {isActive && (
        <VideoControlsWrapper>
          <AudioControlsPill state={state} />
        </VideoControlsWrapper>
      )}
    </HeaderContainer>
  );
}

export default React.memo(TranscriptHeaderBar);
