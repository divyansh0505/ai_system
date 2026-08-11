import * as React from "react";
import styled from "@emotion/styled";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Base = styled.label({
  display: "inline-block",
  fontSize: 14,
  fontWeight: 500,
  color: "#111827",
});

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return <Base ref={ref} className={className} {...props} />;
  }
);


export default Label;


