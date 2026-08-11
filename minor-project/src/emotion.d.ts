import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      primary: string;
      text: string;
      caption: string;
      destructive: string;
      disabled: string;
      destructiveForeground: string;
      surface: string;
      background: string;
      placeholder: string;
      secondary: string;
      secondaryForeground: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      ring: string;
    };
  }
}

// You are also able to use a 3rd party theme this way:
import "@emotion/react";
import { LibTheme } from "some-lib";

declare module "@emotion/react" {
  export interface Theme extends LibTheme {}
}
