import * as React from "react";
import { useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import { analytics } from "@/services/analytics";
import { useSessionStore } from "@/store/sessionStore";
import { bookMeetingClicked } from "@/services/agentRPC";
import { REVENUE_HERO_URL } from "@/utils/constants";
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

const RevenueHeroContent: React.FC<{
  frameWindow: Window;
  frameDocument: Document;
}> = ({ frameWindow, frameDocument }) => {
  const email = useSessionStore((state) => state.email);

  const src = useMemo(() => {
    if (!email) return REVENUE_HERO_URL;
    return `${REVENUE_HERO_URL}?email=${encodeURIComponent(email)}`;
  }, [email]);

  useEffect(() => {
    if (!frameWindow) {
      console.error("[RevenueHeroWidget] No frameWindow available!");
      return;
    }

    const handleMessage = async (e: MessageEvent) => {
      // Revenue Hero sends postMessage events with a `type` field
      const type = e.data?.type;
      if (!type) return;

      switch (type) {
        case "MEETING_BOOKED":
          analytics.trackCalendarProviderEvent(
            "revenue-hero",
            "meeting_booked",
            e.data.meeting,
          );
          try {
            await bookMeetingClicked({ is_meeting_booked: true });
          } catch (error) {
            console.error("[RevenueHeroWidget] RPC error:", error);
          }
          break;

        case "MEETING_RESCHEDULED":
          analytics.trackCalendarProviderEvent(
            "revenue-hero",
            "meeting_rescheduled",
            e.data.meeting,
          );
          break;

        case "PAGE_LOADED":
          analytics.trackCalendarProviderEvent("revenue-hero", "page_viewed");
          break;

        case "PROSPECT_DISQUALIFIED":
          analytics.trackCalendarProviderEvent(
            "revenue-hero",
            "prospect_disqualified",
          );
          break;

        // RESIZE_IFRAME, CLOSE_DIALOG, ADDING_GUEST, ADDED_GUEST, CLOSE_ADD_GUEST
        // are intentionally not handled — the iframe is full-height and we don't
        // render a dialog wrapper here.
        default:
          break;
      }
    };

    frameWindow.addEventListener("message", handleMessage, false);
    analytics.trackCalendar("opened");

    return () => {
      frameWindow.removeEventListener("message", handleMessage, false);
      analytics.trackCalendar("closed");
    };
  }, [frameWindow, frameDocument]);

  return (
    <CalendarContainer>
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Book a meeting"
        allow="camera; microphone"
      />
    </CalendarContainer>
  );
};

const RevenueHeroWidget = () => {
  return (
    <FrameContextConsumer>
      {({ window: frameWindow, document: frameDocument }) => {
        if (!frameWindow || !frameDocument) {
          console.error(
            "[RevenueHeroWidget] FrameContext not available - not in iframe!",
          );
          return null;
        }

        return (
          <RevenueHeroContent
            frameWindow={frameWindow}
            frameDocument={frameDocument}
          />
        );
      }}
    </FrameContextConsumer>
  );
};

export default React.memo(RevenueHeroWidget);
