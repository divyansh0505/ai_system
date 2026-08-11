import * as React from "react";
import styled from "@emotion/styled";
import humanAvatars from "/images/humans-avatar.png";

type Variant = "default" | "compact";

interface HumanInteractionStatusProps {
  className?: string;
  avatarHeight?: number;
  variant?: Variant;
}

const StatusContainer = styled.div<{ variant: Variant }>((props) => ({
  display: "flex",
  gap: props.variant === "compact" ? "4px" : "10px",
  alignItems: "center",
  position: "relative",
  borderRadius: "63px",
  flexShrink: 0,
}));

const AvatarGroupImage = styled.img<{ height: number }>((props) => ({
  height: `${props.height}px`,
  width: "auto",
  flexShrink: 0,
  display: "block",
}));

const StatusText = styled.div<{ variant: Variant }>((props) => ({
  display: "flex",
  gap: props.variant === "compact" ? "4px" : "5px",
  alignItems: "center",
  fontSize: props.variant === "compact" ? "12px" : "16px",
  lineHeight: "1.2",
  textTransform: "lowercase",
  whiteSpace: "pre",
  flexShrink: 0,
  position: "relative",
}));

const CountText = styled.p<{ variant: Variant }>((props) => ({
  fontWeight: 600,
  color: "#09090b",
  margin: 0,
  flexShrink: 0,
  fontSize: props.variant === "compact" ? "12px" : "inherit",
}));

const NormalText = styled.p<{ variant: Variant }>((props) => ({
  fontWeight: 400,
  color: "#27272a",
  margin: 0,
  flexShrink: 0,
  fontSize: props.variant === "compact" ? "12px" : "inherit",
}));

const HumanInteractionStatus: React.FC<HumanInteractionStatusProps> = ({
  className,
  avatarHeight,
  variant = "default",
}) => {
  const defaultAvatarHeight = variant === "compact" ? 18 : 44;
  const finalAvatarHeight = avatarHeight ?? defaultAvatarHeight;

  const randomCount = React.useMemo(
    () => Math.floor(Math.random() * (999 - 800 + 1)) + 800,
    [],
  );

  return (
    <StatusContainer className={className} variant={variant}>
      <AvatarGroupImage
        height={finalAvatarHeight}
        src={humanAvatars}
        alt="Human avatars"
      />
      <StatusText variant={variant}>
        <CountText variant={variant}>{randomCount}</CountText>
        {variant === "compact" ? (
          <NormalText variant={variant}>people live</NormalText>
        ) : (
          <>
            <NormalText variant={variant}>humans</NormalText>
            <NormalText variant={variant}>ARE</NormalText>
            <NormalText variant={variant}>interacting </NormalText>
          </>
        )}
      </StatusText>
    </StatusContainer>
  );
};

export default React.memo(HumanInteractionStatus);
