import * as React from "react";
import { InlineWidget } from "react-calendly";
import { useEffect } from "react";
import styled from "@emotion/styled";
import { analytics } from "@/services/analytics";
import { useSessionStore } from "@/store/sessionStore";
import { bookMeetingClicked } from "@/services/agentRPC";
import { CALENDLY_URL } from "@/utils/constants";
import { FrameContextConsumer } from "react-frame-component";

const CalendarContainer = styled.div({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  animation: "fadeIn 0.5s ease-out",

  "@keyframes fadeIn": {
    "0%": {
      opacity: 0,
    },
    "100%": {
      opacity: 1,
    },
  },

  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
});

const CalendlyContent: React.FC<{
  frameWindow: Window;
  frameDocument: Document;
}> = ({ frameWindow, frameDocument }) => {
  const email = useSessionStore((state) => state.email);

  // Listen for Calendly messages using the iframe's window
  useEffect(() => {
    if (!frameWindow) {
      console.error("[CalendlyWidget] No frameWindow available!");
      return;
    }

    const handleMessage = async (e: MessageEvent) => {
      // Only process messages from Calendly
      if (
        !e.origin.includes("calendly.com") ||
        !e.data?.event?.startsWith?.("calendly.")
      ) {
        return;
      }

      const eventType = e.data.event;

      // Handle different Calendly events
      switch (eventType) {
        case "calendly.event_scheduled":
          analytics.trackCalendarProviderEvent(
            "calendly",
            "meeting_booked",
            e.data.payload,
          );
          try {
            await bookMeetingClicked({ is_meeting_booked: true });
          } catch (error) {
            console.error("[CalendlyWidget] RPC error:", error);
          }
          break;

        case "calendly.profile_page_viewed":
          analytics.trackCalendarProviderEvent("calendly", "page_viewed");
          break;

        case "calendly.date_and_time_selected":
          analytics.trackCalendarProviderEvent("calendly", "date_selected");
          break;

        case "calendly.event_type_viewed":
          analytics.trackCalendarProviderEvent("calendly", "event_type_viewed");
          break;
      }
    };

    // Listen on the iframe's window (parent of the Calendly iframe)
    frameWindow.addEventListener("message", handleMessage, false);
    analytics.trackCalendar("opened");

    return () => {
      frameWindow.removeEventListener("message", handleMessage, false);
      analytics.trackCalendar("closed");
    };
  }, [frameWindow, frameDocument]);

  return (
    <CalendarContainer>
      <InlineWidget
        url={CALENDLY_URL}
        css={{ width: "100%", height: "100%" }}
        prefill={{
          email: email || "",
        }}
      />
    </CalendarContainer>
  );
};

const CalendlyWidget = () => {
  return (
    <FrameContextConsumer>
      {({ window: frameWindow, document: frameDocument }) => {
        if (!frameWindow || !frameDocument) {
          console.error(
            "[CalendlyWidget] FrameContext not available - not in iframe!",
          );
          return null;
        }

        return (
          <CalendlyContent
            frameWindow={frameWindow}
            frameDocument={frameDocument}
          />
        );
      }}
    </FrameContextConsumer>
  );
};

export default React.memo(CalendlyWidget);
