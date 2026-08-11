import * as React from "react";
import styled from "@emotion/styled";
import * as RadixDialog from "@radix-ui/react-dialog";
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";
import { useFrame } from "react-frame-component";
import { X } from "lucide-react";
import { theme } from "@/styles/theme";

// Re-export Radix primitives
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const VisuallyHidden = VisuallyHiddenPrimitive.Root;

// Styled Components
export const DialogOverlay = styled(RadixDialog.Overlay)({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(17, 24, 39, 0.75)",
  zIndex: 40,
});

// Styled DialogContent
const DialogContentStyled = styled(RadixDialog.Content)({
  position: "fixed",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: "92vw",
  maxHeight: "85vh",
  overflowY: "auto",
  borderRadius: "1rem",
  border: "1px solid rgba(17,24,39,0.08)",
  backgroundColor: theme.colors.background,
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.3)",
  padding: "1.75rem",
  outline: "none",
  zIndex: 50,
  "@media (max-width: 640px)": {
    padding: "1.667rem",
    borderRadius: "0.875rem",
    maxHeight: "90vh",
  },
});

// Styled DialogCloseButton
const DialogCloseButtonStyled = styled(RadixDialog.Close)({
  position: "absolute",
  top: "1rem",
  right: "1rem",
  borderRadius: "0.125rem",
  opacity: 0.7,
  transition: "opacity 200ms ease-out",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  padding: "0.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 51,
  "&:hover": {
    opacity: 1,
  },
  "&:focus": {
    outline: "none",
    boxShadow: "0 0 0 2px #ffffff, 0 0 0 4px #3b82f6",
    borderRadius: "0.125rem",
  },
  "&:disabled": {
    pointerEvents: "none",
  },
  "& svg": {
    pointerEvents: "none",
    flexShrink: 0,
    width: "1rem",
    height: "1rem",
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
  },
});

interface DialogContentProps extends React.ComponentProps<
  typeof RadixDialog.Content
> {
  showCloseButton?: boolean;
}

export function DialogContent({
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogContentStyled data-slot="dialog-content" {...props}>
        {children}
        {showCloseButton && (
          <DialogCloseButtonStyled data-slot="dialog-close">
            <X size={16} />
            <span className="sr-only">Close</span>
          </DialogCloseButtonStyled>
        )}
      </DialogContentStyled>
    </DialogPortal>
  );
}

export const DialogHeader = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "0.375rem",
  marginBottom: "1.75rem",
  textAlign: "start",
});

export const DialogFooter = styled.div({
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-start",
  gap: "0.75rem",
  marginTop: "1.5rem",
});

export const DialogTitle = styled(RadixDialog.Title)({
  margin: 0,
  fontSize: "2rem",
  lineHeight: 1.3,
  fontWeight: 600,
  color: "#111827",
  letterSpacing: "-0.01em",
  "@media (max-width: 640px)": {
    fontSize: "1.5rem",
    lineHeight: 1.35,
  },
});

export const DialogDescription = styled(RadixDialog.Description)({
  margin: 0,
  fontSize: "1.5rem",
  lineHeight: 1.55,
  color: "#374151",
  fontStyle: "italic",
  marginTop: "0.125rem",
  "@media (max-width: 640px)": {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
});

// Custom Portal with frame support
export interface DialogPortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
}

export function DialogPortal({ children, container }: DialogPortalProps) {
  const frame = useFrame();

  const portalContainer = React.useMemo(() => {
    return (
      (container?.isConnected ? container : null) ??
      (frame.document?.body?.isConnected ? frame.document.body : null) ??
      undefined
    );
  }, [container, frame]);

  return (
    <RadixDialog.Portal container={portalContainer}>
      {children}
    </RadixDialog.Portal>
  );
}
