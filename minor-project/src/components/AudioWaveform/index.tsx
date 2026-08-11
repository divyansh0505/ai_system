import styled from "@emotion/styled";
import {
  useAudioWaveform,
  type TrackReferenceOrPlaceholder,
  useVoiceAssistant,
} from "@livekit/components-react";
import { useScrollingWaveform } from "@/lib/livekit/hooks/useScrollingWaveform";
import { useMemo } from "react";

const WaveformContainer = styled.div({
  position: "absolute",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  width: "100%",
  height: "100%",
  zIndex: 1,
  pointerEvents: "none",
});

const WaveformBar = styled.span({
  width: "0.2rem",
  transformOrigin: "center",
  borderRadius: "1rem",
  backgroundColor: "#000000",
  transition: "height 0.08s ease-out",
});

interface AudioWaveformProps {
  minHeight?: number;
  className?: string;
  micEnabled?: boolean;
  trackRef: TrackReferenceOrPlaceholder;
}

function AudioWaveform({
  minHeight = 14,
  className,
  micEnabled = true,
  trackRef,
}: AudioWaveformProps) {
  const { state } = useVoiceAssistant();

  const { bars } = useAudioWaveform(trackRef, {
    barCount: 30,
    updateInterval: 50,
    volMultiplier: 2,
  });

  const isListening = state === "listening";

  const displayBars = useScrollingWaveform({
    bars,
    isActive: isListening,
    barCount: 30,
  });

  const renderedBars = useMemo(
    () =>
      displayBars.map((barValue, index) => {
        const height = Math.max(minHeight, barValue * 100);
        return <WaveformBar key={index} css={{ height: `${height}px` }} />;
      }),
    [displayBars, minHeight],
  );

  if (!isListening || !micEnabled) {
    return null;
  }

  return (
    <WaveformContainer className={className}>{renderedBars}</WaveformContainer>
  );
}

export default AudioWaveform;
