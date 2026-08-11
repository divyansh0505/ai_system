import * as React from "react";

import FrameWrapper from "@/components/FrameWrapper/FrameWrapper";
import { Global } from "@emotion/react";
import styled from "@emotion/styled";
import globalStyles from "@/styles/global";
import InlineBanner from "./banners/InlineBanner";
import BottomBanner from "./banners/BottomBanner";
import ExitIntentModal from "./modals/ExitIntentModal";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useStore } from "@/store";
import { useExitIntent } from "./hooks/useExitIntent";
import type { LauncherType } from "./types";

export type { LauncherType } from "./types";
export { default as ExitIntentModal } from "./modals/ExitIntentModal";

const TriggerFrame = styled(FrameWrapper)({
  border: "none",
  height: "500px",
  width: "100%",
  zIndex: 999,
});

const BottomBannerFrame = styled(FrameWrapper)`
  position: fixed !important;
  bottom: 0px !important;
  left: 0 !important;
  right: 0 !important;
  margin: auto !important;
  z-index: 999 !important;

  width: 780px !important;
  height: 320px !important;
  min-height: 60px !important;

  display: block !important;
  border: none !important;
  overflow: visible !important;

  pointer-events: auto;
`;

interface LauncherManagerProps {
  onInteractClick: (question?: string, launcherSource?: string) => void;
  launcherType: LauncherType;
  enableExitIntent?: boolean;
}

function LauncherManager({
  onInteractClick,
  launcherType,
  enableExitIntent = true,
}: LauncherManagerProps) {
  const showBanner = useFeatureFlagEnabled("showBanner");
  const exitIntent = useStore((state) => state.exitIntent);
  const closeExitIntent = useStore((state) => state.closeExitIntent);
  const markExitIntentShown = useStore((state) => state.markExitIntentShown);

  useExitIntent({
    enabled:
      enableExitIntent && launcherType !== "pitch" && launcherType !== "direct",
  });

  const handleJoinExperience = React.useCallback(() => {
    closeExitIntent();
    onInteractClick("", "exit_intent_modal");
  }, [closeExitIntent, onInteractClick]);

  const handleLauncherInteract = React.useCallback(
    (question?: string, launcherSource?: string) => {
      markExitIntentShown();
      onInteractClick(question, launcherSource);
    },
    [markExitIntentShown, onInteractClick],
  );

  if (launcherType === "pitch" || launcherType === "direct") return null;

  return (
    <>
      <ExitIntentModal
        isOpen={exitIntent.isOpen}
        onClose={closeExitIntent}
        onJoinExperience={handleJoinExperience}
      />

      {showBanner && launcherType === "bottom" && (
        <BottomBannerFrame>
          <Global styles={globalStyles} />
          <BottomBanner
            onInputSubmit={(question) =>
              handleLauncherInteract(question, "bottom_banner")
            }
          />
        </BottomBannerFrame>
      )}

      {showBanner && launcherType === "inline" && (
        <TriggerFrame>
          <Global styles={globalStyles} />
          <InlineBanner
            onInteractClick={() => handleLauncherInteract("", "inline_banner")}
          />
        </TriggerFrame>
      )}
    </>
  );
}

export default React.memo(LauncherManager);
