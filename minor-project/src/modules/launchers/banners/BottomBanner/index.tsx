import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useWidgetStore } from "@/store/widgetStore";
import mayaVideo from "/video/maya-bottom.webm";
import waveGif from "/video/wave.gif";

const springTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
  mass: 0.3,
};

interface BottomBannerProps {
  onInputSubmit?: (value: string) => void;
  className?: string;
}

const ONBOARDING_TEXT = "Hi, I'm Maya. How can I help you today?";

const BannerWrapper = styled(motion.div)({
  width: "100%",
  maxWidth: "290px",
  bottom: "18px",
  left: 0,
  right: 0,
  margin: "0 auto",
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  overflow: "visible",
});

const SpeechBubble = styled(motion.div)({
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "10px 14px",
  marginBottom: "10px",
  position: "relative",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  width: "fit-content",
  maxWidth: "100%",
  marginLeft: "0",
  marginRight: "auto",
  "&::before": {
    content: '""',
    position: "absolute",
    bottom: "-5px",
    left: "20px",
    width: "10px",
    height: "10px",
    backgroundColor: "#ffffff",
    transform: "rotate(45deg)",
    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.05)",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: "0",
    left: "16px",
    width: "18px",
    height: "8px",
    backgroundColor: "#ffffff",
  },
});

const SpeechBubbleText = styled(motion.p)({
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: 1.4,
  color: "#1a1a2e",
  margin: 0,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
});

const AvatarButtonContainer = styled.div({
  width: "48px",
  height: "48px",
  background: "#F6F5F2",
  backgroundClip: "padding-box",
  border: "4px solid transparent",
  borderRadius: "50%",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
  position: "relative",
  cursor: "pointer",
  zIndex: 1,
  "&::before": {
    content: '""',
    position: "absolute",
    inset: "2px",
    borderRadius: "14px",
    background:
      "linear-gradient(90deg, rgba(255, 97, 210, 0.7), rgba(209, 255, 56, 0.7), rgba(255, 97, 210, 0.7))",
    backgroundSize: "200% 100%",
    backgroundPosition: "0% 0%",
    filter: "blur(10px)",
    zIndex: 0,
    pointerEvents: "none",
    animation: "maya-banner-glow-move 4s ease-in-out infinite",
  },

  "@keyframes maya-banner-glow-move": {
    "0%": {
      backgroundPosition: "0% 0%",
    },
    "50%": {
      backgroundPosition: "100% 0%",
    },
    "100%": {
      backgroundPosition: "0% 0%",
    },
  },
});

const ContentButtonContainer = styled.div({
  background: "#F6F5F2",
  backgroundClip: "padding-box",
  border: "4px solid transparent",
  borderRadius: "28px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
  position: "relative",
  cursor: "pointer",
  zIndex: 1,
  "&::before": {
    content: '""',
    position: "absolute",
    inset: "2px",
    borderRadius: "14px",
    background:
      "linear-gradient(90deg, rgba(255, 97, 210, 0.7), rgba(209, 255, 56, 0.7), rgba(255, 97, 210, 0.7))",
    backgroundSize: "200% 100%",
    backgroundPosition: "0% 0%",
    filter: "blur(10px)",
    zIndex: 0,
    pointerEvents: "none",
    animation: "maya-banner-glow-move 4s ease-in-out infinite",
  },

  "@keyframes maya-banner-glow-move": {
    "0%": {
      backgroundPosition: "0% 0%",
    },
    "50%": {
      backgroundPosition: "100% 0%",
    },
    "100%": {
      backgroundPosition: "0% 0%",
    },
  },
});

const AvatarButton = styled.button({
  position: "relative",
  width: "48px",
  height: "48px",
  borderRight: "1px solid #eef1f6",
  flexShrink: 0,
  overflow: "hidden",
  borderRadius: "50%",
  border: "none",
  cursor: "pointer",
});

const MayaAvatar = styled.video({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform: "scale(1.25)",
});

// Content Section
const ContentButton = styled.button({
  cursor: "pointer",
  height: "48px",
  borderRadius: "28px",
  border: "none",
  backgroundColor: "#F6F5F2",
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  paddingRight: "16px",
  paddingLeft: "10px",
  overflow: "hidden",
  boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
  boxSizing: "border-box",
});

const MessageText = styled.p({
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "15px",
  textAlign: "center",
  lineHeight: 1.4,
  color: "#780d4c",
  margin: 0,
});

const ButtonContent = styled(motion.span)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
});

const WaveIcon = styled.img({
  width: "34px",
  height: "28px",
  display: "block",
});

const BottomRowContainer = styled.div({
  display: "flex",
  flexDirection: "row",
  gap: "4px",
  width: "100%",
  alignItems: "flex-start",
});

const BottomBanner: React.FC<BottomBannerProps> = ({
  onInputSubmit,
  className,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);

  const { isMobile, isTablet } = useDeviceDetection();
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);

  // Typing effect - only run once on initial load
  useEffect(() => {
    if (hasAnimationCompleted) return;

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < ONBOARDING_TEXT.length) {
        setDisplayedText(ONBOARDING_TEXT.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setHasAnimationCompleted(true);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [hasAnimationCompleted]);

  const handleBannerClick = () => {
    onInputSubmit?.("");
  };

  if (isMobile || isTablet || widgetDisplayMode === "minimized") {
    return null;
  }

  return (
    <BannerWrapper
      key="expanded"
      className={className}
      layoutId="maya-bottom-banner"
      transition={springTransition}
    >
      {/* Speech Bubble */}
      <SpeechBubble
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
      >
        <SpeechBubbleText>
          {hasAnimationCompleted ? ONBOARDING_TEXT : displayedText}
          {!hasAnimationCompleted && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{ marginLeft: "1px" }}
            >
              |
            </motion.span>
          )}
        </SpeechBubbleText>
      </SpeechBubble>

      {/* Bottom Row with Avatar and Content */}
      <BottomRowContainer>
        <AvatarButtonContainer>
          <AvatarButton onClick={handleBannerClick}>
            <MayaAvatar src={mayaVideo} autoPlay muted loop playsInline />
          </AvatarButton>
        </AvatarButtonContainer>
        {/* Content Section */}
        <ContentButtonContainer>
          <ContentButton onClick={handleBannerClick}>
            <ButtonContent>
              <WaveIcon src={waveGif} alt="Wave animation" />
            </ButtonContent>
            <MessageText>Talk to our agent Maya</MessageText>
          </ContentButton>
        </ContentButtonContainer>
      </BottomRowContainer>
    </BannerWrapper>
  );
};

export default React.memo(BottomBanner);
