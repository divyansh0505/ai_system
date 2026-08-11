import { css } from "@emotion/react";

const globalStyles = css({
  "@font-face": [
    // SF Pro - Regular
    {
      fontFamily: "SFPro",
      src: `url('assets/fonts/SF-Pro-Display-Regular.woff2') format('woff2'),
            url('assets/fonts/SF-Pro-Display-Regular.otf') format('opentype'),
            url('assets/fonts/SF-Pro-Display-Regular.ttf') format('truetype')`,
      fontWeight: 500,
      fontStyle: "normal",
      fontDisplay: "swap",
    },
    // SF Pro - Medium
    {
      fontFamily: "SFProMedium",
      src: `url('assets/fonts/SF-Pro-Display-Medium.woff2') format('woff2'),
            url('assets/fonts/SF-Pro-Display-Medium.otf') format('opentype'),
            url('assets/fonts/SF-Pro-Display-Medium.ttf') format('truetype')`,
      fontWeight: 500,
      fontStyle: "normal",
      fontDisplay: "swap",
    },
    // SF Pro - Bold
    {
      fontFamily: "SFProBold",
      src: `url('assets/fonts/SF-Pro-Display-Bold.woff2') format('woff2'),
            url('assets/fonts/SF-Pro-Display-Bold.otf') format('opentype'),
            url('assets/fonts/SF-Pro-Display-Bold.ttf') format('truetype')`,
      fontWeight: 600,
      fontStyle: "normal",
      fontDisplay: "swap",
    },
    // Instrument Sans - Medium
    {
      fontFamily: "Instrument Sans",
      src: `url('assets/fonts/Instrument-Sans-Medium.woff2') format('woff2'),
            url('assets/fonts/Instrument-Sans-Medium.otf') format('opentype'),
            url('assets/fonts/Instrument-Sans-Medium.ttf') format('truetype')`,
      fontWeight: 500,
      fontStyle: "normal",
      fontDisplay: "swap",
    },
  ],
  html: {
    fontFamily:
      "SFPro, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontSize: "12px",
    height: "100%",
  },
  body: {
    margin: 0,
    height: "100%",
  },
  // react-frame-component internal elements
  ".frame-root": {
    height: "100%",
  },
  ".frame-content": {
    height: "100%",
  },
});

export default globalStyles;
