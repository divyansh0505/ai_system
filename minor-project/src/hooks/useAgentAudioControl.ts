import { useCallback, useState } from "react";
import { RemoteAudioTrack } from "livekit-client";
import { RemoteTrackPublication } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";

export function useAgentAudioControl() {
  const room = useRoomContext();
  const [isAgentMuted, setIsAgentMuted] = useState(false);

  const handleToggleAgentMute = useCallback(() => {
    const newMutedState = !isAgentMuted;
    setIsAgentMuted(newMutedState);

    room.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach(
        (pub: RemoteTrackPublication) => {
          const track = pub.audioTrack as RemoteAudioTrack | undefined;
          if (track) {
            track.setVolume(newMutedState ? 0 : 1);
          }
        }
      );
    });
  }, [isAgentMuted, room]);

  return {
    isAgentMuted,
    handleToggleAgentMute,
  };
}
