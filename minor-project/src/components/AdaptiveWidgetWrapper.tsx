import * as React from "react";
import styled from "@emotion/styled";
import { Global } from "@emotion/react";
import globalStyles from "@/styles/global";
import FrameWrapper from "@/components/FrameWrapper/FrameWrapper";
import { useWidgetStore, WidgetDisplayMode } from "@/store/widgetStore";
import { WidgetPortal } from "@/components/Portal";

interface FrameStyleProps {
  $displayMode: WidgetDisplayMode;
}

const ContentFrame = styled(FrameWrapper)<FrameStyleProps>(
  ({ $displayMode }) =>
    $displayMode === "minimized"
      ? {
          border: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "340px",
          height: "600px",
          overflow: "hidden",
        }
      : {
          border: "none",
          position: "fixed",
          bottom: "0",
          right: "0",
          height: "100dvh",
          width: "100dvw",
        },
);

interface AdaptiveWidgetWrapperProps {
  children: React.ReactNode;
}

export function AdaptiveWidgetWrapper({
  children,
}: AdaptiveWidgetWrapperProps) {
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);

  return (
    <WidgetPortal>
      <ContentFrame $displayMode={widgetDisplayMode}>
        <Global styles={globalStyles} />
        {children}
      </ContentFrame>
    </WidgetPortal>
  );
}
