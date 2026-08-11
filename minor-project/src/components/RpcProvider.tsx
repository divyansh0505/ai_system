import * as React from "react";
import { useRoomContext, useVoiceAssistant } from "@livekit/components-react";
import { isTrackReference } from "@livekit/components-core";
import { initAgentRPC, cleanupAgentRPC } from "@/services/agentRPC";
import { analytics, SessionStatus } from "@/services/analytics";
import { useAssistantStore } from "@/store/assistantStore";
import { useSessionStore } from "@/store/sessionStore";
import { LIVEKIT_SERVER_URL } from "@/utils/constants";
import { registerTools, unregisterTools } from "@/tools";

interface RpcProviderProps {
  organizationId: string;
  children: React.ReactNode;
}

export function RpcProvider({ organizationId, children }: RpcProviderProps) {
  const room = useRoomContext();
  const [isReady, setIsReady] = React.useState(false);

  const { videoTrack } = useVoiceAssistant();
  const setAgentVideoReady = useAssistantStore(
    (state) => state.setAgentVideoReady,
  );
  const isVideoReady = videoTrack && isTrackReference(videoTrack);

  React.useEffect(() => {
    setAgentVideoReady(!!isVideoReady);
  }, [isVideoReady, setAgentVideoReady]);

  const session = useSessionStore((state) => state.session);
  const hubspotutk = useSessionStore((state) => state.hubspotutk);

  const sessionId = session?.sessionId;
  const userName = session?.userName;
  const roomName = session?.roomName;

  React.useLayoutEffect(() => {
    initAgentRPC(room);
    registerTools(room);
    setIsReady(true);

    return () => {
      unregisterTools(room);
      cleanupAgentRPC();
    };
  }, [room]);

  React.useEffect(() => {
    if (userName) {
      analytics.identify(userName, {
        room_name: roomName,
        organization_id: organizationId,
      });
    }
  }, [userName, roomName, organizationId]);

  React.useEffect(() => {
    if (!sessionId) return;

    const sessionData = {
      livekit_url: LIVEKIT_SERVER_URL,
      ...(hubspotutk && { hubspotutk }),
    };

    analytics.startSession(sessionId, sessionData);

    return () => {
      const currentOutcome = useAssistantStore.getState().sessionOutcome;
      analytics.endSession(currentOutcome || SessionStatus.ABANDONED);
    };
  }, [sessionId, hubspotutk]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
