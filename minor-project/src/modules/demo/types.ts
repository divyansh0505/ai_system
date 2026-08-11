/**
 * Type definitions for demo player iframe communication
 */

export interface DemoNavigationMessage {
  type: "demo_navigation";
  selector: string;
  selectorType: string;
}

export interface DemoClearStorageMessage {
  type: "demo_clear_storage";
}

export interface UserClickMessage {
  type: "user_click";
  url: string;
  previousUrl: string;
}

export type IframeMessage =
  | DemoNavigationMessage
  | DemoClearStorageMessage
  | UserClickMessage;
