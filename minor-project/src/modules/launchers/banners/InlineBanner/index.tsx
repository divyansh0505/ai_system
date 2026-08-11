import * as React from "react";
import styled from "@emotion/styled";
import bannerVideo from "/video/banner.webm";
import HumanInteractionStatus from "../../components/HumanInteraction";
import AnimatedQuestion from "./AnimatedQuestion";
import CTAButton from "../../components/CTAButton";

interface InlineBannerProps {
  onInteractClick?: () => void;
  className?: string;
}

const BannerContainer = styled.section({
  marginTop: "2rem",
  marginBottom: "2rem",
  display: "flex",
  justifyContent: "center",
  width: "100%",
});

const BannerContent = styled.div({
  position: "relative",
  width: "100%",
  maxWidth: "1200px",
  height: "450px",
  borderRadius: "12px",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end", // Align content to the right
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  cursor: "pointer",
});

const BackgroundVideo = styled.video({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  zIndex: 0,
});

const ContentWrapper = styled.div({
  position: "relative",
  zIndex: 1,
  width: "53%", // Take up the right half
  padding: "0 4rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  "@media (max-width: 768px)": {
    width: "100%",
    padding: "2rem",
    background: "rgba(255, 255, 255, 0.8)", // Add background for readability on small screens if needed
  },
});

const InteractionStatusWrapper = styled.div({
  backdropFilter: "blur(46.5px)",
  WebkitBackdropFilter: "blur(46.5px)",
  backgroundColor: "rgba(240, 243, 245, 0.35)",
  border: "1px solid rgba(255, 255, 255, 0.5)",
  borderRadius: "24px 24px 0 0",
  boxShadow: "0px 3px 18.9px 0px rgba(70, 70, 70, 0.14)",
  padding: "8px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  alignItems: "flex-start",
  position: "absolute",
  bottom: 0,
  right: "2rem",
  maxWidth: "520px",
  minWidth: "350px",
  zIndex: 2,
  "@media (max-width: 768px)": {
    right: "1rem",
    left: "1rem",
    maxWidth: "none",
    minWidth: "auto",
  },
});

const ROTATING_QUESTIONS = [
  "Is sprinto gonna audit my platform?",
  "Dev bandwidth needed to get compliant?",
  "Can I connect with AWS in Sprinto?",
  "Do I have to add all compliances myself?",
  "Can I also use sprinto for GDPR?",
  "What all compliances does Sprinto support?",
];

const Headline = styled.h1({
  fontSize: "2.5rem",
  fontWeight: 700,
  lineHeight: "1.2",
  margin: 0,
  color: "#000000",
  letterSpacing: "-0.02em",
});

const SubTitle = styled.p({
  fontSize: "1.25rem",
  color: "#333333",
  marginBottom: "4rem",
});

const InlineBanner: React.FC<InlineBannerProps> = ({
  onInteractClick,
  className,
}) => {
  return (
    <BannerContainer className={className}>
      <BannerContent onClick={onInteractClick}>
        <BackgroundVideo src={bannerVideo} autoPlay loop muted playsInline />
        <ContentWrapper>
          <Headline>Maya can show you Sprinto in 2 mins!</Headline>
          <SubTitle>Skip the wait, no signup required.</SubTitle>
          <CTAButton
            onClick={(e) => {
              e?.stopPropagation(); // Prevent double-triggering
              onInteractClick?.();
            }}
          />
        </ContentWrapper>
        <InteractionStatusWrapper>
          <HumanInteractionStatus />
          <AnimatedQuestion questions={ROTATING_QUESTIONS} />
        </InteractionStatusWrapper>
      </BannerContent>
    </BannerContainer>
  );
};

export default React.memo(InlineBanner);
