import * as React from "react";
import styled from "@emotion/styled";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  leftSectionPointerEvents?: "none" | "all";
  rightSectionPointerEvents?: "none" | "all";
};

const Wrapper = styled.div({
  position: "relative",
  display: "flex",
  alignItems: "center",
  flex: 1,
  minWidth: 0,
});

const Section = styled.span<{
  side: "left" | "right";
  sectionPointerEvents: "none" | "all";
}>(({ side, sectionPointerEvents }) => ({
  position: "absolute",
  [side]: 12,
  display: "flex",
  alignItems: "center",
  pointerEvents: sectionPointerEvents,
  color: "#9ca3af",
  zIndex: 1,
}));

const Base = styled.input<{
  hasLeftSection?: boolean;
  hasRightSection?: boolean;
}>(({ theme, hasLeftSection, hasRightSection }) => ({
  flex: 1,
  minWidth: 0,
  height: 40,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  paddingLeft: hasLeftSection ? 38 : 12,
  paddingRight: hasRightSection ? 38 : 12,
  fontSize: 14,
  color: theme.colors.text,
  outline: "none",
  transition: "box-shadow .15s ease, border-color .15s ease",
  "&:focus": {
    boxShadow: "0 0 0 2px rgba(17,24,39,0.10)",
    borderColor: theme.colors.primary,
  },
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
}));

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      leftSection,
      rightSection,
      leftSectionPointerEvents = "none",
      rightSectionPointerEvents = "none",
      ...props
    },
    ref,
  ) => {
    if (!leftSection && !rightSection) {
      return <Base ref={ref} className={className} {...props} />;
    }

    return (
      <Wrapper className={className}>
        {leftSection && (
          <Section side="left" sectionPointerEvents={leftSectionPointerEvents}>
            {leftSection}
          </Section>
        )}
        <Base
          ref={ref}
          hasLeftSection={!!leftSection}
          hasRightSection={!!rightSection}
          {...props}
        />
        {rightSection && (
          <Section
            side="right"
            sectionPointerEvents={rightSectionPointerEvents}
          >
            {rightSection}
          </Section>
        )}
      </Wrapper>
    );
  },
);

Input.displayName = "Input";

export default Input;
