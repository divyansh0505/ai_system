import * as React from "react";
import styled from "@emotion/styled";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>;

const Root = styled(RadixCheckbox.Root)({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  borderRadius: 4,
  border: "1.5px solid #e5e7eb",
  backgroundColor: "#ffffff",
  cursor: "pointer",
  transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  ["&[data-state='checked']"]: {
    backgroundColor: "#2B5CE3",
    color: "#ffffff",
  },
  ["&:focus-visible"]: {
    outline: "none",
    boxShadow: "0 0 0 2px rgba(17,24,39,0.15)",
  },
  ["&:disabled"]: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

const Indicator = styled(RadixCheckbox.Indicator)({
  display: "grid",
  placeItems: "center",
  color: "#ffffff",
});

const Checkbox = React.forwardRef<React.ElementRef<typeof RadixCheckbox.Root>, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <Root ref={ref} className={className} {...props}>
        <Indicator>
          <CheckIcon size={14} strokeWidth={2.3} />
        </Indicator>
      </Root>
    );
  }
);


export default Checkbox;


