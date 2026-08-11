import * as React from "react";
import styled from "@emotion/styled";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { useWidgetStore } from "@/store/widgetStore";

const InputContainer = styled.form<{ $isMinimized: boolean }>({
  zIndex: 2,
  position: "relative",
  padding: "8px 10px 10px 10px",
});

const InputWrapper = styled.div<{ $isMinimized: boolean }>(({ $isMinimized, theme }) => ({
  display: "flex",
  alignItems: "center",
  borderRadius: $isMinimized ? "8px" : "16px",
  border: "1px solid #E5E7EB",
  backgroundColor: "#F2F2F7",
  maxHeight: $isMinimized ? "40px" : "52px",
  width: "100%",
  boxSizing: "border-box",
  transition: "box-shadow 0.2s ease, transform 0.2s ease",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  padding: $isMinimized ? "2px 2px 4px 0" : "8px 4px 8px 0",
  "&:focus-within": {
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    borderColor: theme.colors.primary,
  },
}));

const StyledInput = styled(Input)<{ $isMinimized: boolean }>(({ $isMinimized }) => ({
  flex: 1,
  height: "100%",
  border: "none",
  backgroundColor: "transparent",
  boxShadow: "none",
  paddingTop: "0",
  paddingBottom: "0",
  "&:focus": {
    boxShadow: "none",
    borderColor: "transparent",
  },
  fontSize: $isMinimized ? "12px" : "13px",
}));

function InputBar({
  onSubmit,
  disabled = false,
  placeholder = "Type your message...",
}: {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);
  const isMinimized = widgetDisplayMode === "minimized";
  const [textInput, setTextInput] = React.useState("");

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && textInput.trim()) {
      e.preventDefault();
      onSubmit(textInput);
      setTextInput("");
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (textInput.trim()) {
      onSubmit(textInput);
      setTextInput("");
    }
  }

  return (
    <div
      css={{
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <InputContainer $isMinimized={isMinimized} onSubmit={handleFormSubmit}>
        <InputWrapper $isMinimized={isMinimized}>
          <StyledInput
            $isMinimized={isMinimized}
            type="text"
            autoFocus
            placeholder={placeholder}
            aria-label="Message input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
          />
          <Button
            icon={SendHorizontal}
            variant="default"
            size="icon"
            rounded
            aria-label="Send"
            disabled={disabled || !textInput.trim()}
            onClick={() => onSubmit(textInput)}
            css={
              isMinimized
              && {
                margin: "4px",
                height: "28px",
                width: "28px",
              }

            }
          />
        </InputWrapper>
      </InputContainer>
    </div>
  );
}

export default React.memo(InputBar);
