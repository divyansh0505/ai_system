import * as React from "react";
import styled from "@emotion/styled";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import Button from "@/components/ui/Button";
import AudioWaveform from "@/components/AudioWaveform";
import { useMicrophoneControl } from "@/hooks/useMicrophoneControl";
import { useAgentAudioControl } from "@/hooks/useAgentAudioControl";
import { useWidgetStore } from "@/store/widgetStore";
import type { AgentState } from "@livekit/components-react";

const PillContainer = styled.div<{ $isMinimized: boolean }>(({ $isMinimized }) => ({
  display: "flex",
  gap: $isMinimized ? "0.35rem" : "0.5rem",
  borderRadius: "1.17538rem",
  padding: $isMinimized ? "0.35rem 0.5rem" : "0.5rem 0.75rem",
  justifyContent: "center",
  alignItems: "center",
  border: "1px solid #F2F3F4",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(100, 100, 115, 0.16) 100%)",
  boxShadow:
    "0 12px 36px 5px rgba(63, 66, 106, 0.24), 0px 1px 15px 0px rgba(255,255,255,0.07) inset",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  pointerEvents: "auto",
}));

const CenterContainer = styled.div<{ $isExpanded: boolean }>(
  ({ $isExpanded }) => ({
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: $isExpanded ? "180px" : "0px",
    height: "1rem",
    transition: "width 0.3s ease-out",
    overflow: "hidden",
  }),
);

interface AudioControlsPillProps {
  state: AgentState;
}

function AudioControlsPill({ state }: AudioControlsPillProps) {
  const { microphoneTrack, micTrackRef, handleToggleMicrophone } =
    useMicrophoneControl(state, {
      autoMuteOnAgentSpeak: true,
    });

  const { isAgentMuted, handleToggleAgentMute } = useAgentAudioControl();
  const widgetState = useWidgetStore((state) => state.widgetState);
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);
  const isMinimized = widgetDisplayMode === "minimized";

  const isListening = state === "listening";
  const shouldExpand = isListening && microphoneTrack.enabled;

  return (
    <PillContainer $isMinimized={isMinimized}>
      <Button
        onClick={handleToggleMicrophone}
        icon={microphoneTrack.enabled ? Mic : MicOff}
        variant={microphoneTrack.enabled ? "secondary" : "destructive"}
        size={isMinimized ? "sm" : "icon"}
        rounded
        disabled={widgetState !== "active"}
        aria-label="Toggle microphone"
      />
      <CenterContainer $isExpanded={shouldExpand}>
        {micTrackRef && (
          <AudioWaveform
            minHeight={4}
            micEnabled={microphoneTrack.enabled}
            trackRef={micTrackRef}
          />
        )}
      </CenterContainer>
      <Button
        onClick={handleToggleAgentMute}
        icon={isAgentMuted ? VolumeX : Volume2}
        variant={isAgentMuted ? "destructive" : "secondary"}
        size={isMinimized ? "sm" : "icon"}
        rounded
        aria-label="Toggle agent audio"
      />
    </PillContainer>
  );
}

export default React.memo(AudioControlsPill);
