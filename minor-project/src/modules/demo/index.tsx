import * as React from "react";
import { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { useDemoStore, useDemoUrl } from "./store/demoStore";
import { useFrame } from "react-frame-component";
import { userClickedOnPage } from "@/services/agentRPC";
import { analytics } from "@/services/analytics";

const DemoIframe = styled.iframe({
  width: "100%",
  height: "100%",
  borderRadius: "1.1rem",
  border: "none",
  display: "block",

  "@media (max-width: 1500px)": {
    zoom: 0.8,
  },

  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
});

/**
 * DemoPlayer component that manages iframe communication for product demos
 * Handles navigation requests, storage clearing, and user interaction tracking
 */
function DemoPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const demoUrl = useDemoUrl();
  const demoNavigationRequest = useDemoStore(
    (state) => state.demoNavigationRequest,
  );
  const clearDemoNavigationRequest = useDemoStore(
    (state) => state.clearDemoNavigationRequest,
  );
  const demoClearStorageRequest = useDemoStore(
    (state) => state.demoClearStorageRequest,
  );
  const dismissStorageRequest = useDemoStore(
    (state) => state.dismissStorageRequest,
  );

  const productDemoIframe = useFrame();

  // Track demo start/stop
  useEffect(() => {
    analytics.trackDemo("started");

    return () => {
      analytics.trackDemo("completed");
    };
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!demoUrl) return;

      const trustedOrigin = new URL(demoUrl).origin;
      if (event.origin !== trustedOrigin) return;

      if (event.data?.type === "user_click") {
        const { url, previousUrl } = event.data;

        analytics.track("demo_user_click", {
          previous_url: previousUrl,
          new_url: url,
        });

        await userClickedOnPage(
          JSON.stringify({
            type: "user_clicked_on_page",
            previousUrl,
            newUrl: url,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    };

    productDemoIframe?.window?.addEventListener("message", handleMessage);
    return () =>
      productDemoIframe?.window?.removeEventListener("message", handleMessage);
  }, [productDemoIframe, demoUrl]);

  // Handle navigation requests from store
  useEffect(() => {
    if (demoNavigationRequest) {
      analytics.track("demo_navigation_request", {
        selector: demoNavigationRequest.selector,
        selector_type: demoNavigationRequest.selectorType,
      });

      iframeRef?.current?.contentWindow?.postMessage(
        {
          type: "demo_navigation",
          selector: demoNavigationRequest.selector,
          selectorType: demoNavigationRequest.selectorType,
        },
        "*",
      );

      clearDemoNavigationRequest();
    }
  }, [demoNavigationRequest, clearDemoNavigationRequest]);

  // Handle storage clear requests from store
  useEffect(() => {
    if (demoClearStorageRequest) {
      iframeRef?.current?.contentWindow?.postMessage(
        {
          type: "demo_clear_storage",
        },
        "*",
      );

      dismissStorageRequest();
    }
  }, [demoClearStorageRequest, dismissStorageRequest]);

  if (!demoUrl) return null;

  return (
    <DemoIframe
      ref={iframeRef}
      src={demoUrl}
      allowFullScreen
      title="Demo Player"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
      allow="clipboard-read; clipboard-write"
    />
  );
}

export default React.memo(DemoPlayer);
