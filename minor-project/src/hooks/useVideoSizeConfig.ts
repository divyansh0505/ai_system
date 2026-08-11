import { useMemo } from "react";
import { SCREEN_BREAKPOINT_LG, VIDEO_SIZES } from "@/utils/constants";

interface VideoSizeConfig {
  width: string;
  height: string;
}

export const useVideoSizeConfig = (): VideoSizeConfig => {
  const config = useMemo(() => {
    const screenWidth = window.innerWidth;
    const isLargeScreen = screenWidth >= SCREEN_BREAKPOINT_LG;

    const size = isLargeScreen ? VIDEO_SIZES.LARGE : VIDEO_SIZES.DEFAULT;

    return {
      width: `${size.width}rem`,
      height: `${size.height}rem`,
    };
  }, []);

  return config;
};
