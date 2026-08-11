import styled from "@emotion/styled";

const Overlay = styled.div({
  width: "100dvw",
  height: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(240, 240, 240, 0.3)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 900,
  overflow: "hidden",
  pointerEvents: "auto",
});

export default Overlay;
