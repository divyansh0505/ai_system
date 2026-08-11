import * as React from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useVoiceAssistant, useRoomContext } from "@livekit/components-react";
import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { useWidgetStore } from "@/store/widgetStore";
import { useStore } from "@/store";
import { MESSAGE_BOX_WIDTH } from "@/utils/constants";
import { resetAllStores } from "@/lib/resetStores";
import { analytics } from "@/services/analytics";

import Transcripts from "@/modules/transcript";
import SpeakingBorder from "@/components/SpeakingBorder";
import Calendar from "@/modules/calendar";
import DemoPlayer from "@/modules/demo";
import { SlidesDesktop, usePresentationMode } from "@/modules/slides";
import WidgetControl from "./WidgetControl";
import MinimizedControlBar from "./MinimizedControlBar";
import FormContainer from "@/components/Onboarding/FormContainer";

interface WidgetLayoutProps {
  $isMinimized: boolean;
}

const WidgetLayout = styled.div<WidgetLayoutProps>(({ $isMinimized }) => ({
  display: "flex",
  flexDirection: $isMinimized ? "column" : "row",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  "&:hover .minimized-control-area": {
    opacity: 1,
    transform: "translateY(0)",
  },
}));

const MinimizedControlArea = styled(motion.div)({
  display: "flex",
  justifyContent: "flex-end",
  marginRight: 10,
  height: 60,
  position: "relative",
  zIndex: 100,
  flexShrink: 0,
  opacity: 0,
  transform: "translateY(10px)",
  transition: "opacity 300ms ease, transform 300ms ease",
});

const ContentArea = styled.div<{ isHidden: boolean }>(({ isHidden }) => ({
  position: "relative",
  flex: 1,
  borderRadius: "1rem",
  padding: "0.6rem",
  overflow: "visible",
  transform: "translateZ(0)",
  display: isHidden ? "none" : "block",
  willChange: "auto",
  zIndex: 0,
}));

const CalendarContainer = styled.div<{ isVisible: boolean }>((props) => ({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: props.isVisible ? 500 : -1,
  pointerEvents: props.isVisible ? "auto" : "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  transition: "opacity 150ms ease, z-index 150ms ease",
}));

interface MessagesPanelProps {
  $isMinimized: boolean;
}

const MessagesPanel = styled(motion.div)<MessagesPanelProps>(
  ({ $isMinimized }) => ({
    backgroundPosition: "right",
    boxSizing: "border-box",
    display: "flex",
    overflow: "visible",
    position: "relative",
    zIndex: 10,
    ...($isMinimized
      ? {
          flex: 1,
          minHeight: 0, // Allow flex shrinking
          padding: 0,
          margin: "0 20px 20px 20px",
        }
      : {
          height: "100%",
          flexShrink: 0,
          padding: "0.6rem",
        }),
  }),
);

const FormContainerOverlay = styled(motion.div)({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: 100,
  backgroundColor: "rgba(24, 24, 27, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  pointerEvents: "auto",
});

const FormCard = styled.div({
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow:
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  width: "min(500px, 90%)",
});

function WidgetDesktop() {
  const room = useRoomContext();
  const toggle = useStore((state) => state.toggle);
  const contentMode = useAssistantStore((state) => state.contentMode);
  const preloadedMode = useAssistantStore((state) => state.preloadedMode);
  const isPresentationMode = usePresentationMode();
  const widgetState = useWidgetStore((state) => state.widgetState);
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);
  const setWidgetDisplayMode = useWidgetStore(
    (state) => state.setWidgetDisplayMode,
  );
  const widgetType = useStore((state) => state.widgetType);
  const { state } = useVoiceAssistant();

  const isMinimized = widgetDisplayMode === "minimized";
  const isCalendarVisible = contentMode === ContentMode.CALENDAR;
  const isCalendarPreloaded = preloadedMode === ContentMode.CALENDAR;
  const showFormContainer = widgetState !== "active";

  const handleMaximize = React.useCallback(() => {
    setWidgetDisplayMode("full");
  }, [setWidgetDisplayMode]);

  const handleClose = React.useCallback(async () => {
    await room.disconnect();
    resetAllStores();
    analytics.trackWidgetClose();
    toggle();
  }, [room, toggle]);

  return (
    <WidgetLayout $isMinimized={isMinimized}>
      {isMinimized && (
        <MinimizedControlArea className="minimized-control-area">
          <MinimizedControlBar
            onMaximize={handleMaximize}
            onClose={handleClose}
          />
        </MinimizedControlArea>
      )}
      <MessagesPanel
        $isMinimized={isMinimized}
        animate={{
          width: isMinimized
            ? "auto"
            : isPresentationMode
              ? "0px"
              : `${MESSAGE_BOX_WIDTH}rem`,
          opacity: !isMinimized && isPresentationMode ? 0 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <Transcripts />
      </MessagesPanel>

      {/* Content area - hidden when minimized */}
      <ContentArea isHidden={isMinimized}>
        {!isCalendarVisible && widgetType !== "pitch" && (
          <SpeakingBorder
            isVisible={state === "speaking" && !isCalendarVisible}
          >
            <DemoPlayer />
          </SpeakingBorder>
        )}
        {!isCalendarVisible && widgetType === "pitch" && <SlidesDesktop />}
        {(isCalendarPreloaded || isCalendarVisible) && (
          <CalendarContainer isVisible={isCalendarVisible}>
            <Calendar />
          </CalendarContainer>
        )}
        {showFormContainer && widgetType !== "pitch" && (
          <FormContainerOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FormCard>
              <FormContainer widgetState={widgetState} />
            </FormCard>
          </FormContainerOverlay>
        )}
      </ContentArea>

      {/* Widget control - hidden when minimized */}
      {!isMinimized && <WidgetControl />}
    </WidgetLayout>
  );
}

export default React.memo(WidgetDesktop);
