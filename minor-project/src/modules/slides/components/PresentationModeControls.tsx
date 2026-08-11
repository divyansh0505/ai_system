import styled from "@emotion/styled";
import { Presentation } from "lucide-react";
import { useSlidesStore } from "../store/slidesStore";
import { useStore } from "@/store";
import Button from "@/components/ui/Button";

const MenuButton = styled(Button)({
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.65) 100%)",
  color: "#000000",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  borderRadius: "12px",
  paddingLeft: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
  backdropFilter: "blur(12px) saturate(180%)",
  WebkitBackdropFilter: "blur(12px) saturate(180%)",
  transition: "all 0.2s ease",
  position: "relative",
  overflow: "hidden",
  opacity: 1,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)",
    pointerEvents: "none",
  },
  "&:hover:not(:disabled)": {
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    opacity: 1,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)",
    transform: "translateY(-1px)",
  },
  "&:active:not(:disabled)": {
    transform: "translateY(0)",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
  },
});

/**
 * Presentation mode controls for desktop pitch widgets
 * Shows "Slideshow" button to enter presentation mode
 * Shows "Exit slideshow" button + TalkToHuman when in presentation mode
 */
export function PresentationModeControls() {
  const widgetType = useStore((state) => state.widgetType);
  const isPresentationMode = useSlidesStore(
    (state) => state.isPresentationMode,
  );
  const enterPresentationMode = useSlidesStore(
    (state) => state.enterPresentationMode,
  );
  const exitPresentationMode = useSlidesStore(
    (state) => state.exitPresentationMode,
  );

  // Only show for pitch widgets
  if (widgetType !== "pitch") {
    return null;
  }

  if (isPresentationMode) {
    return (
      <>
        <MenuButton
          onClick={exitPresentationMode}
          icon={Presentation}
          aria-label="Exit Slideshow"
          css={{ color: "red" }}
        >
          Exit slideshow
        </MenuButton>
      </>
    );
  }

  return (
    <MenuButton
      onClick={enterPresentationMode}
      icon={Presentation}
      aria-label="Start Slideshow"
    >
      Slideshow
    </MenuButton>
  );
}
