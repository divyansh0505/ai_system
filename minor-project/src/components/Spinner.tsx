import { Loader2 } from "lucide-react";
import styled from "@emotion/styled";

const Spinner = styled(Loader2)({
  height: "1.5rem",
  marginLeft: "1rem",
  animation: "spin 1s linear infinite",
  "@keyframes spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },
});

export default Spinner;
