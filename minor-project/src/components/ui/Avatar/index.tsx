import * as React from "react";
import styled from "@emotion/styled";

const Root = styled.div<{ $size: number }>(({ $size }) => ({
  position: "relative",
  width: `${$size}px`,
  height: `${$size}px`,
  borderRadius: "10px",
  flexShrink: 0,
  overflow: "hidden",
  border: "3px solid #fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
}));

const Img = styled.img({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
});

const Fallback = styled.div(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: theme.colors.accentForeground,
  color: theme.colors.background,
}));

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: React.ReactNode;
}

const PersonIcon = ({ size }: { size: number }) => (
  <svg
    width={size * 0.5}
    height={size * 0.5}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  size = 44,
  fallback,
}) => {
  return (
    <Root $size={size}>
      {!src ? (
        <Fallback>{fallback ?? <PersonIcon size={size} />}</Fallback>
      ) : (
        <Img
          src={src}
          alt={alt}
        />
      )}
    </Root>
  );
};

export default Avatar;
