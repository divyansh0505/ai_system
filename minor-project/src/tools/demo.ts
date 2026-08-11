import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { useDemoStore } from "@/modules/demo/store/demoStore";
import { useWidgetStore } from "@/store/widgetStore";
import { RpcInvocationData } from "livekit-client";

export async function openDemo(data: RpcInvocationData) {
  const demoState = data?.payload ? JSON.parse(data.payload) : {};

  if (demoState.show_demo) {
    useDemoStore.getState().clearDemoNavigationRequest();
    useAssistantStore.getState().setContentMode(ContentMode.DEMO);

    useWidgetStore.getState().setWidgetDisplayMode("full");
  }

  return JSON.stringify({
    success: true,
    message: "Demo loaded successfully",
  });
}
