import * as React from "react";
import styled from "@emotion/styled";
import { VideoTrack } from "@livekit/components-react";
import {
  TrackReferenceOrPlaceholder,
  isTrackReference,
} from "@livekit/components-core";
import { motion, AnimatePresence } from "framer-motion";
import MayaImage from "/images/maya-image.png";
import fallbackVideoSrc from "/video/movement.webm";

const VideoCardContainer = styled(motion.div)<{
  width?: string;
  height?: string;
}>(({ width, height }) => ({
  width: width || "25rem",
  height: height || "21.75rem",
  overflow: "hidden",
  position: "relative",
  transform: "translate3d(0, 0, 0)",
  willChange: "transform, opacity",
}));

const StyledFallbackImage = styled.img({
  objectFit: "cover",
  display: "block",
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 0,
});

const StyledVideo = styled(motion.video)({
  objectFit: "cover",
  display: "block",
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 2,
});

const StyledVideoTrackContainer = styled(motion.div)({
  display: "block",
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 3,
});

interface VideoCardProps extends React.ComponentProps<
  typeof VideoCardContainer
> {
  videoTrack?: TrackReferenceOrPlaceholder | undefined;
  staticVideoSrc?: string;
  loop?: boolean;
  onVideoEnded?: () => void;
  height?: string;
  width?: string;
  layoutId?: string;
}

function VideoCard({
  videoTrack,
  staticVideoSrc,
  onVideoEnded,
  loop = false,
  width,
  height,
  layoutId,
  ...props
}: VideoCardProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = React.useState(staticVideoSrc);
  const [isLooping, setIsLooping] = React.useState(loop);

  // Check if we have a valid LiveKit video track
  const hasLiveKitVideo = videoTrack && isTrackReference(videoTrack);

  // Update current video source when static video source changes
  React.useEffect(() => {
    setCurrentVideoSrc(staticVideoSrc);
    setIsLooping(loop);
  }, [staticVideoSrc, loop]);

  // Handle video ended event to switch to fallback
  const handleVideoEnded = React.useCallback(() => {
    if (currentVideoSrc !== fallbackVideoSrc && !loop) {
      setCurrentVideoSrc(fallbackVideoSrc);
      setIsLooping(true);
    }

    onVideoEnded?.();
  }, [currentVideoSrc, onVideoEnded, loop]);

  // Auto-play static video when loaded (only if LiveKit video is not available)
  React.useEffect(() => {
    if (!currentVideoSrc || !videoRef.current || hasLiveKitVideo) return;

    const video = videoRef.current;

    const playVideo = async () => {
      try {
        await video.play();
        video.muted = false;
      } catch (error) {
        console.error("Error playing video:", error);
      }
    };

    if (video.readyState >= 3) {
      playVideo();
    } else {
      video.addEventListener("canplaythrough", playVideo, { once: true });
    }

    return () => {
      video.removeEventListener("canplaythrough", playVideo);
    };
  }, [currentVideoSrc, hasLiveKitVideo]);

  return (
    <VideoCardContainer
      width={width}
      height={height}
      layoutId={layoutId}
      layout
      transition={{
        layout: {
          type: "tween",
          duration: 0.3,
          ease: "easeInOut",
        },
      }}
      {...props}
    >
      <StyledFallbackImage
        src={MayaImage}
        alt="Maya Image"
        aria-hidden="true"
      />

      <AnimatePresence mode="wait">
        {/* Render LiveKit video with crossfade if available */}
        {hasLiveKitVideo ? (
          <StyledVideoTrackContainer key="livekit-video">
            <VideoTrack
              trackRef={videoTrack}
              disablePictureInPicture
              playsInline
              css={{
                objectFit: "cover",
                display: "block",
                width: "100%",
                height: "100%",
              }}
            />
          </StyledVideoTrackContainer>
        ) : (
          currentVideoSrc && (
            <StyledVideo
              ref={videoRef}
              src={currentVideoSrc}
              preload="auto"
              muted
              playsInline
              loop={isLooping}
              disablePictureInPicture
              onEnded={handleVideoEnded}
            />
          )
        )}
      </AnimatePresence>
    </VideoCardContainer>
  );
}

export default VideoCard;
