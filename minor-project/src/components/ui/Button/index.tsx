import * as React from "react";
import styled from "@emotion/styled";
import { Interpolation, Theme } from "@emotion/react";
import { LucideIcon } from "lucide-react";
import { theme } from "@/styles/theme";

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary";

export type ButtonSize = "default" | "sm" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  isLoading?: boolean;
  rounded?: boolean;
  css?: Interpolation<Theme>;
}

const buttonVariants = {
  default: {
    backgroundColor: theme.colors.primary,
    color: "#ffffff",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      opacity: 0.9,
    },
  },
  destructive: {
    backgroundColor: theme.colors.destructive,
    color: theme.colors.destructiveForeground,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      opacity: 0.9,
    },
  },
  outline: {
    border: `1px solid ${theme.colors.ring}`,
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: theme.colors.accent,
      color: theme.colors.accentForeground,
    },
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    color: theme.colors.secondaryForeground,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      opacity: 0.8,
    },
  },
};

const buttonSizes = {
  default: {
    height: "40px",
    padding: "0 16px",
    fontSize: "1.25rem", // 16px
  },
  sm: {
    height: "36px",
    width: "36px",
    padding: "0",
  },
  icon: {
    height: "40px",
    width: "40px",
    padding: "0",
  },
};

const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  isLoading?: boolean;
  rounded?: boolean;
}>((props) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: props.rounded ? "9999px" : "8px",
  fontWeight: 500,
  whiteSpace: "nowrap",
  transition: "colors 0.2s",
  outline: "none",
  border: "none",
  cursor: "pointer",
  userSelect: "none",

  "&:disabled": {
    pointerEvents: "none",
    opacity: 0.5,
  },

  "&:focus-visible": {
    outline: `2px solid ${theme.colors.ring}`,
    outlineOffset: "2px",
  },

  ...buttonVariants[props.variant],
  ...buttonSizes[props.size],

  ...(props.isLoading && {
    cursor: "not-allowed",
    opacity: 0.7,
  }),
}));

const Spinner = styled.div`
  margin-right: 8px;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      icon: Icon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <StyledButton
        ref={ref}
        variant={variant}
        size={size}
        isLoading={isLoading}
        rounded={props.rounded}
        disabled={props.disabled || isLoading}
        className={className}
        {...props}
      >
        {isLoading && <Spinner />}
        {!isLoading && Icon && (
          <Icon size={16} css={{ margin: children ? "0.5rem" : "0" }} />
        )}
        {children}
      </StyledButton>
    );
  },
);

Button.displayName = "Button";

export default Button;

export { Button, buttonVariants, buttonSizes };
