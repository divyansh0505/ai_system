import styled from "@emotion/styled";
import AutoRotateIcon from "/icons/rotate.png";

const Footer = styled.div({
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bottom: "20px",
  width: "100%",
  color: "#52525B",
  fontSize: "14px",
  gap: "6px",
});

const MobileHint = () => (
  <Footer>
    <img
      src={AutoRotateIcon}
      height={16}
      width={16}
      alt="Rotate icon"
    />
    <p>
      Disable autorotate for better experience
    </p>
  </Footer>
);

export default MobileHint;
