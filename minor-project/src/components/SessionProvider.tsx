import * as React from "react";
import styled from "@emotion/styled";

import Intro from "./Intro";
import RoomContainer from "./RoomContainer";
import {
  createAuthToken,
  createLivekitToken,
  enrichUser,
} from "@/services/auth";
import { LIVEKIT_SERVER_URL, ORG_ID } from "@/utils/constants";
import { getProjectConfig } from "@/utils/urlParams";
import { useAssistantStore } from "@/store/assistantStore";
import { useStore } from "@/store";
import { useSessionStore } from "@/store/sessionStore";
import { useWidgetStore } from "@/store/widgetStore";
import backgroundSvg from "/images/background.svg";

interface BackgroundProps {
  $isMinimized: boolean;
}

const Background = styled.div<BackgroundProps>(({ $isMinimized }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  height: "100%",
  width: "100%",
  ...($isMinimized
    ? {
        backgroundColor: "transparent",
        backgroundImage: "none",
      }
    : {
        backgroundColor: "#F1F0ED",
        backgroundImage: `url("${backgroundSvg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }),
}));

export function SessionProvider() {
  const projectConfig = React.useMemo(
    () =>
      getProjectConfig({
        organizationId: ORG_ID,
        projectId: null,
        projectType: null,
        emailCollection: "required",
      }),
    [],
  );

  const widgetType = useStore((state) => state.widgetType);
  const setAuth = useSessionStore((state) => state.setAuth);
  const setSession = useSessionStore((state) => state.setSession);
  const token = useSessionStore((state) => state.session?.token);
  const setUserEmail = useAssistantStore((state) => state.setUserEmail);
  const setEmailSubmitted = useAssistantStore(
    (state) => state.setEmailSubmitted,
  );
  const hubspotutk = useSessionStore((state) => state.hubspotutk);
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);

  const isPitch = widgetType === "pitch";
  const isMinimized = widgetDisplayMode === "minimized";

  const emailCollection = projectConfig.emailCollection;
  const [connectError, setConnectError] = React.useState<string>();
  const [introDone, setIntroDone] = React.useState(false);

  const hasToken = !!token;

  const initializeSession = React.useCallback(
    async (email: string | null) => {
      try {
        const auth = await createAuthToken({
          organizationId: projectConfig.organizationId,
          projectId: projectConfig.projectId,
          projectType: projectConfig.projectType,
          userEmail: email,
        });

        setAuth(auth);
        setUserEmail(email ?? "");

        const sessionData = await createLivekitToken({
          orgId: projectConfig.organizationId,
          projectId: projectConfig.projectId,
          projectType: projectConfig.projectType,
        });

        setSession(sessionData);
        if (email) {
          setEmailSubmitted(true);
        }

        if (isPitch && email && sessionData.sessionId) {
          enrichUser(email, sessionData.sessionId, hubspotutk);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to initialize session. Please try again.";
        setConnectError(message);
        console.error("Session initialization error:", message);
      }
    },
    [projectConfig, isPitch, hubspotutk],
  );

  React.useEffect(() => {
    if (emailCollection === "none") {
      initializeSession(null);
    }
  }, []);

  return (
    <Background $isMinimized={isMinimized}>
      {!introDone && (
        <Intro
          organizationId={projectConfig.organizationId}
          emailCollection={emailCollection}
          hasToken={hasToken}
          onEmailSubmit={initializeSession}
          onComplete={() => setIntroDone(true)}
          connectError={connectError}
        />
      )}

      {hasToken && (
        <div css={{ display: introDone ? "contents" : "none" }}>
          <RoomContainer
            projectConfig={projectConfig}
            serverUrl={LIVEKIT_SERVER_URL}
          />
        </div>
      )}
    </Background>
  );
}
