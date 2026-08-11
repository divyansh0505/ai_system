import { useCallback, useEffect, useRef } from "react";
import { Track } from "livekit-client";
import {
  useLocalParticipant,
  useTrackToggle,
  useTracks,
} from "@livekit/components-react";

export interface UseMicrophoneControlOptions {
  autoMuteOnAgentSpeak?: boolean;
}

export function useMicrophoneControl(
  agentState: string,
  options: UseMicrophoneControlOptions = {}
) {
  const { autoMuteOnAgentSpeak = true } = options;
  const { localParticipant } = useLocalParticipant();

  const microphoneTrack = useTrackToggle({
    source: Track.Source.Microphone,
  });

  const tracks = useTracks([
    {
      source: Track.Source.Microphone,
      withPlaceholder: false,
      participant: localParticipant,
    },
  ]);
  const micTrackRef = tracks[0];

  const prevStateRef = useRef(agentState);

  useEffect(() => {
    if (!autoMuteOnAgentSpeak) return;

    const prevState = prevStateRef.current;

    if (prevState !== "speaking" && agentState === "speaking") {
      if (microphoneTrack.enabled) {
        microphoneTrack.toggle();
      }
    }

    prevStateRef.current = agentState;
  }, [agentState, microphoneTrack, autoMuteOnAgentSpeak]);

  const handleToggleMicrophone = useCallback(() => {
    microphoneTrack.toggle();
  }, [microphoneTrack]);

  return {
    microphoneTrack,
    micTrackRef,
    handleToggleMicrophone,
  };
}
