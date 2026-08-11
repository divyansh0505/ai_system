import * as React from "react";
import styled from "@emotion/styled";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { LayoutGroup } from "framer-motion";

import Widget from "./Widget";
import { RpcProvider } from "./RpcProvider";
import { useSessionStore } from "@/store/sessionStore";
import type { ProjectConfig } from "@/utils/urlParams";

const WidgetContainer = styled.div(({ theme }) => ({
  color: theme.colors.text,
  overflow: "hidden",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  height: "100dvh",
  width: "100dvw",
}));

interface RoomContainerProps {
  projectConfig: ProjectConfig;
  serverUrl: string;
}

function RoomContainer({ projectConfig, serverUrl }: RoomContainerProps) {
  const token = useSessionStore((state) => state.session?.token);

  return (
    <div
      css={{
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
      }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        css={{ height: "100%", width: "100%" }}
      >
        <RpcProvider organizationId={projectConfig.organizationId}>
          <LayoutGroup>
            <WidgetContainer>
              <Widget />
            </WidgetContainer>
          </LayoutGroup>
        </RpcProvider>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

export default React.memo(RoomContainer);
