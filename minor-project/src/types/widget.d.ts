export interface InteractnowWidgetConfig {
  apiKey: string;
  domain: string;
  orgId?: string;
  startFullscreen?: boolean;
  theme?: {
    primary?: string;
  };
}

declare global {
  interface Window {
    CHAT_WIDGET_CONFIG?: InteractnowWidgetConfig;
  }
}

export {};
