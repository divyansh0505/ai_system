import { Room, RpcError, RpcInvocationData } from "livekit-client";
import { functionMap } from "./index.ts";
import { analytics } from "@/services/analytics";

/**
 * Register all AI-callable functions with the chat service
 * This should be called once during application initialization
 */
export function registerTools(room: Room): void {
  Object.entries(functionMap).forEach(([toolName, callbackFn]) => {
    room.registerRpcMethod(toolName, async (data: RpcInvocationData) => {
      const startTime = Date.now();
      try {
        analytics.trackToolInvocation(toolName, {
          caller_identity: data.callerIdentity,
          request_id: data.requestId,
        });

        const result = await callbackFn(data);

        analytics.track("tool_completed", {
          tool_name: toolName,
          execution_time: Date.now() - startTime,
          success: true,
        });

        return result;
      } catch (error) {
        analytics.trackError(
          "tool_execution_failed",
          error instanceof Error ? error.message : "Unknown error",
          {
            tool_name: toolName,
            execution_time: Date.now() - startTime,
            error_stack: error instanceof Error ? error.stack : undefined,
          },
        );

        console.error(`Tool Error: ${toolName}`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new RpcError(1, `Could not execute ${toolName}: ${errorMessage}`);
      }
    });
  });
}

/**
 * Unregister all AI-callable functions
 * This can be called during application cleanup
 */
export function unregisterTools(room: Room): void {
  Object.keys(functionMap).forEach((toolName) => {
    try {
      room.unregisterRpcMethod?.(toolName);
    } catch {
      console.error(`Failed to unregister tool: ${toolName}`);
    }
  });
}
