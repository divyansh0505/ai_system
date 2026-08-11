import * as React from "react";
import styled from "@emotion/styled";
import { useAssistantStore } from "@/store/assistantStore";
import { useWidgetStore } from "@/store/widgetStore";

const Container = styled.div({
  marginTop: "0.5rem",
  backgroundColor: "#E5ECFF",
  marginRight: "0.5rem",
  marginLeft: "0.5rem",
  padding: "6px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
});

const SuggestionItem = styled.div<{ $isMinimized: boolean }>(({ theme, $isMinimized }) => ({
  paddingTop: $isMinimized ? "0.5rem" : "0.75rem",
  paddingBottom: $isMinimized ? "0.5rem" : "0.75rem",
  paddingLeft: "1rem",
  paddingRight: "1rem",
  color: theme.colors.primary,
  borderRadius: $isMinimized ? "6px" : "10px",
  fontSize: $isMinimized ? "12px" : "13px",
  fontWeight: "500",
  cursor: "pointer",
  border: "0.5px solid transparent",

  backgroundColor: "white",
  transition: "background-color 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 8px rgba(43, 92, 227, 0.15)",
    border: "0.5px solid #acbeee",
  },

  "&:active": {
    backgroundColor: "#cec0dd",
  },
}));

function Suggestions({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void;
}) {
  const suggestions = useAssistantStore((state) => state.suggestions);
  const widgetDisplayMode = useWidgetStore((state) => state.widgetDisplayMode);
  if (suggestions && suggestions.length === 0) return null;

  return (
    <Container>
      {suggestions.map((suggestion, index) => (
        <SuggestionItem
          $isMinimized={widgetDisplayMode === "minimized"}
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </SuggestionItem>
      ))}
    </Container>
  );
}

export default React.memo(Suggestions);
