import * as React from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  isKrispNoiseFilterSupported,
  KrispNoiseFilter,
} from "@livekit/krisp-noise-filter";
import { LocalAudioTrack, RoomEvent, Track } from "livekit-client";

import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useWidgetStore } from "@/store/widgetStore";
import WidgetDesktop from "@/components/WidgetDesktop";
import WidgetMobile from "@/components/WidgetMobile";

function Widget() {
  const room = useRoomContext();
  const { isMobile } = useDeviceDetection();
  const setWidgetState = useWidgetStore((state) => state.setWidgetState);

  // Skip onboarding for mobile devices - go directly to active
  React.useEffect(() => {
    if (isMobile) {
      setWidgetState("active");
    }
  }, [isMobile, setWidgetState]);

  // Setup Krisp noise filter for microphone
  React.useEffect(() => {
    const handleTrackPublished = async (trackPublication: any) => {
      if (
        trackPublication.source === Track.Source.Microphone &&
        trackPublication.track instanceof LocalAudioTrack
      ) {
        if (!isKrispNoiseFilterSupported()) {
          console.warn(
            "Krisp noise filter is currently not supported on this browser",
          );
          return;
        }
        const krispProcessor = KrispNoiseFilter();
        await trackPublication.track.setProcessor(krispProcessor);
        await krispProcessor.setEnabled(true);
      }
    };

    room.on(RoomEvent.LocalTrackPublished, handleTrackPublished);

    return () => {
      room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
    };
  }, [room]);

  return <>{isMobile ? <WidgetMobile /> : <WidgetDesktop />}</>;
}

export default React.memo(Widget);
