import { useAssistantStore, ContentMode } from "@/store/assistantStore";
import { useSlidesStore } from "@/modules/slides";
import { useWidgetStore } from "@/store/widgetStore";
import { RpcInvocationData } from "livekit-client";

export async function openSlides(data: RpcInvocationData) {
  const store = useAssistantStore.getState();
  const slidesStore = useSlidesStore.getState();
  const slidesState = data?.payload ? JSON.parse(data.payload) : {};

  // Set the slide number if provided
  // Convert from 1-based indexing (agent) to 0-based indexing (frontend)
  const slideNumber = slidesState.slide_number ?? 1;
  const slideIndex = slideNumber - 1;
  slidesStore.setCurrentSlide(Math.max(0, slideIndex));

  store.setPreloadedMode(ContentMode.SLIDES);
  store.setContentMode(ContentMode.SLIDES);

  useWidgetStore.getState().setWidgetDisplayMode("full");

  return JSON.stringify({
    success: true,
    message: `Slide ${slideNumber} loaded successfully`,
  });
}
