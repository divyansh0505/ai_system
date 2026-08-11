import * as React from "react";
import ReactDOM from "react-dom";
import styled from "@emotion/styled";

/**
 * Z-index layers for the widget
 * All positioning happens through these components
 *
 * Can be configured via window.interactnowConfig.zIndex
 */
const getBaseZIndex = (): number => {
  if (typeof window === "undefined") return 9999;
  return (window as any).interactnowConfig?.zIndex?.base ?? 9999;
};

const LAYER_OFFSETS = {
  widget: 90000, // Base + 90000
  modal: 990000, // Base + 990000
} as const;

const getLayers = () => {
  const base = getBaseZIndex();
  return {
    widget: base + LAYER_OFFSETS.widget,
    modal: base + LAYER_OFFSETS.modal,
  };
};

interface LayerProps {
  children: React.ReactNode;
  className?: string;
}

// Base portal component
const createPortal = (portalId: string, getZIndex: () => number) => {
  const Container = styled.div<{ zIndex: number }>(({ zIndex }) => ({
    position: "fixed",
    inset: 0,
    zIndex,
    pointerEvents: "none", // Let clicks pass through
    "& > *": {
      pointerEvents: "auto", // But children can receive clicks
    },
  }));

  return function Portal({ children, className }: LayerProps) {
    const [container, setContainer] = React.useState<HTMLElement | null>(null);
    const zIndex = getZIndex();

    React.useEffect(() => {
      let element = document.getElementById(portalId);

      if (!element) {
        element = document.createElement("div");
        element.id = portalId;
        document.body.appendChild(element);
      }

      setContainer(element);

      return () => {
        // Cleanup if this was the last portal using this container
        if (element && element.childNodes.length === 0) {
          element.remove();
        }
      };
    }, []);

    return container
      ? ReactDOM.createPortal(
          <Container className={className} zIndex={zIndex}>
            {children}
          </Container>,
          container,
        )
      : null;
  };
};

// Export layer-specific portals
export const WidgetPortal = createPortal(
  "interactnow-widget",
  () => getLayers().widget,
);

export const ModalPortal = createPortal(
  "interactnow-modal",
  () => getLayers().modal,
);

// Export for debugging/docs
export const getZIndexLayers = getLayers;
