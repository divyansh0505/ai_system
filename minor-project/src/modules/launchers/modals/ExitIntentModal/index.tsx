import React from "react";
import styled from "@emotion/styled";
import { Global } from "@emotion/react";
import { AnimatePresence, motion } from "framer-motion";
import { Video, PhoneOff } from "lucide-react";
import FrameWrapper from "@/components/FrameWrapper/FrameWrapper";
import globalStyles from "@/styles/global";
import mayaAvatar from "/images/maya-image.png";
import exitIntentVideo from "/video/exit-intent.webm";
import { ModalPortal } from "@/components/Portal";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinExperience: () => void;
  className?: string;
}

const ModalFrame = styled(FrameWrapper)<{ isOpen: boolean }>(({ isOpen }) => ({
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  border: "none",
  pointerEvents: isOpen ? "auto" : "none",
}));

const Overlay = styled(motion.div)({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(4px)",
});

const ModalContainer = styled(motion.div)({
  width: "calc((90vh - 100px) * 16 / 10)",
  maxWidth: "1200px",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
});

const ModalContent = styled.div({
  backgroundColor: "#ffffff",
  display: "flex",
  flexDirection: "column",
});

const Header = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
});

const AgentInfo = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const Avatar = styled.img({
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  objectFit: "cover",
});

const AgentDetails = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const AgentName = styled.span({
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 600,
  fontSize: "16px",
  color: "#1a1a2e",
});

const AgentRole = styled.span({
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 400,
  fontSize: "14px",
  color: "#6b7280",
});

const ButtonGroup = styled.div({
  display: "flex",
  gap: "12px",
});

const BrowsingButton = styled.button({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1.5px solid #fecaca",
  backgroundColor: "#ffffff",
  color: "#dc2626",
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#fef2f2",
    borderColor: "#f87171",
  },
});

const JoinButton = styled.button({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#22c55e",
  color: "#ffffff",
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#16a34a",
  },
});

const VideoContainer = styled.div({
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 10",
  overflow: "hidden",
  cursor: "pointer",
  "&:focus": {
    outline: "2px solid #780d4c",
    outlineOffset: "4px",
  },
  "&:focus:not(:focus-visible)": {
    outline: "none",
  },
});

const VideoElement = styled.video({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  height: "100%",
  objectFit: "contain",
});

const CaptionBar = styled.div({
  position: "absolute",
  bottom: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0, 0, 0, 0.70)",
  borderRadius: "8px",
  boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.55)",
  backdropFilter: "blur(13.5px)",
  padding: "10px 20px",
  maxWidth: "90%",
  border: "0.5px solid rgba(255, 255, 255, 0.70)",
});

const CaptionText = styled.span({
  fontFamily:
    "'Instrument Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  color: "#ffffff",
  whiteSpace: "nowrap",
});

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({
  isOpen,
  onClose,
  onJoinExperience,
  className,
}) => {
  return (
    <ModalPortal>
      <ModalFrame className={className} isOpen={isOpen}>
        <Global styles={globalStyles} />
        <AnimatePresence>
          {isOpen && (
            <Overlay
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onClose}
            >
              <ModalContainer
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <ModalContent>
                  {/* Header */}
                  <Header>
                    <AgentInfo>
                      <Avatar src={mayaAvatar} alt="Maya" />
                      <AgentDetails>
                        <AgentName>Maya</AgentName>
                        <AgentRole>Sprinto's AI agent</AgentRole>
                      </AgentDetails>
                    </AgentInfo>
                    <ButtonGroup>
                      <BrowsingButton onClick={onClose}>
                        <PhoneOff size={20} />
                        No, I'm just browsing
                      </BrowsingButton>
                      <JoinButton onClick={onJoinExperience}>
                        <Video fill="white" size={24} />
                        Join live experience
                      </JoinButton>
                    </ButtonGroup>
                  </Header>

                  <VideoContainer
                    onClick={onJoinExperience}
                    role="button"
                    tabIndex={0}
                    aria-label="Join live experience with Maya"
                    onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onJoinExperience();
                      }
                    }}
                  >
                    <VideoElement
                      src={exitIntentVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <CaptionBar>
                      <CaptionText>
                        Let me show you exactly how Sprinto works. Live!
                      </CaptionText>
                    </CaptionBar>
                  </VideoContainer>
                </ModalContent>
              </ModalContainer>
            </Overlay>
          )}
        </AnimatePresence>
      </ModalFrame>
    </ModalPortal>
  );
};

export default React.memo(ExitIntentModal);
