import { useDemoStore } from "@/modules/demo/store/demoStore";
import { playClickSound } from "@/utils/sounds";
import { RpcInvocationData } from "livekit-client";

export async function gotoDestination(data: RpcInvocationData) {
  const params = data?.payload ? JSON.parse(data.payload) : {};

  const step = params.step;
  const use_strict_xpath = params.use_strict_xpath || false;
  if (step) {
    const normalizeXPath = (xpath: string) => {
      return xpath.replace(/div\[\d+\]/g, "div");
    };

    // Map agent's data structure to frontend's expected structure
    let selector = step?.element?.selector || step.selector;
    const selectorType = step?.element?.type || step.type || "css";

    // Normalize XPath selectors
    if (selectorType === "xpath" && selector && !use_strict_xpath) {
      selector = normalizeXPath(selector);
    }

    useDemoStore.getState().requestDemoNavigation(selector, selectorType);

    // Play click sound for navigation step with a small pause
    setTimeout(async () => {
      await playClickSound();
    }, 500);

    await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 seconds delay

    return JSON.stringify({
      success: true,
      message: "Navigation step processed",
    });
  }

  return JSON.stringify({
    success: false,
    message: "No navigation step provided",
  });
}
