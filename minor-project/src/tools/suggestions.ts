import { useAssistantStore } from "@/store/assistantStore";

export async function showSuggestions(data: { payload: string }) {
  const setSuggestions = useAssistantStore.getState().setSuggestions;
  const payload = JSON.parse(data.payload);
  setSuggestions(payload.suggestions);

  return JSON.stringify({
    success: true,
    message: "Suggestions displayed successfully",
  });
}
