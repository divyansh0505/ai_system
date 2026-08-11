/** @jsxImportSource @emotion/react */
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

// Animation
const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

interface LoaderProps {
  size?: number;
}

// Styled spinner
const Spinner = styled.div<{ size: number }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  border: ${(props) => Math.max(2, props.size / 10)}px solid #ddd;
  border-top-color: ${(props) => props.theme.colors.text};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// Centering container (optional)
const CenteredWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function Loader({ size = 24 }: LoaderProps) {
  return (
    <CenteredWrapper>
      <Spinner size={size} />
    </CenteredWrapper>
  );
}
