import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { useWidgetStore } from "@/store/widgetStore";
import { RpcInvocationData } from "livekit-client";

export async function openCalendar(data: RpcInvocationData) {
  const params = data?.payload ? JSON.parse(data.payload) : {};

  if (params.show_calendar) {
    useAssistantStore.getState().setPreloadedMode(ContentMode.CALENDAR);
    useAssistantStore.getState().setContentMode(ContentMode.CALENDAR);

    useWidgetStore.getState().setWidgetDisplayMode("full");
  }

  return JSON.stringify({
    success: true,
    message: "Calendar loaded successfully",
  });
}
