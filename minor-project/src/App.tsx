import * as React from "react";
import { useStore } from "@/store";
import { SessionProvider } from "@/components/SessionProvider";
import { AdaptiveWidgetWrapper } from "@/components/AdaptiveWidgetWrapper";
import { analytics } from "@/services/analytics";
import cookieStorage from "@/utils/cookies";
import { useSessionStore } from "@/store/sessionStore";
import LauncherManager from "@/modules/launchers";
import type { LauncherType } from "@/modules/launchers";

interface AppProps {
  launcherType?: LauncherType;
}

function App({ launcherType = null }: AppProps) {
  const isOpen = useStore((state) => state.isOpen);
  const toggleWidget = useStore((state) => state.toggle);
  const setWidgetType = useStore((state) => state.setWidgetType);
  const setInitialQuestion = useStore((state) => state.setInitialQuestion);
  const setHubspotUtk = useSessionStore((state) => state.setHubspotUtk);

  React.useEffect(() => {
    setWidgetType(launcherType);

    // Auto-open widget for pitch and direct modes
    if ((launcherType === "pitch" || launcherType === "direct") && !isOpen) {
      const hubspotutk = cookieStorage.getItem("hubspotutk");
      if (hubspotutk) {
        setHubspotUtk(hubspotutk);
      }
      analytics.trackWidgetOpen(launcherType);
      toggleWidget();
    }
  }, [launcherType, setWidgetType, isOpen, toggleWidget, setHubspotUtk]);

  const handleInteractClick = React.useCallback(
    (question?: string, source?: string) => {
      if (isOpen) return;

      if (question) {
        setInitialQuestion(question);
      }

      const hubspotutk = cookieStorage.getItem("hubspotutk");
      if (hubspotutk) {
        setHubspotUtk(hubspotutk);
      }

      analytics.trackWidgetOpen(source);
      toggleWidget();
    },
    [isOpen, toggleWidget, setInitialQuestion, setHubspotUtk],
  );

  return (
    <React.Fragment>
      <LauncherManager
        onInteractClick={handleInteractClick}
        launcherType={launcherType}
      />

      {isOpen && (
        <AdaptiveWidgetWrapper>
          <SessionProvider />
        </AdaptiveWidgetWrapper>
      )}
    </React.Fragment>
  );
}

export default App;
