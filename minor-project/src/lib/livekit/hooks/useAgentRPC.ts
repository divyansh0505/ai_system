/**
 * Generic LiveKit hooks for agent communication and RPC
 */

import { useCallback } from "react";
import { ParticipantKind, Room } from "livekit-client";

/**
 * Hook to find the agent participant from a LiveKit room
 * @param room - The LiveKit room instance
 * @returns Object with findAgentParticipant function
 */
export const useAgentParticipant = (room: Room) => {
  const findAgentParticipant = useCallback(() => {
    return Array.from(room.remoteParticipants.values()).find(
      (p) =>
        p.kind === ParticipantKind.AGENT &&
        !("lk.publish_on_behalf" in p.attributes),
    );
  }, [room]);

  return { findAgentParticipant };
};

/**
 * Generic hook to perform RPC calls to the agent participant
 * @param room - The LiveKit room instance
 * @returns Object with performAgentRPC function
 */
export const useAgentRPC = (room: Room) => {
  const { findAgentParticipant } = useAgentParticipant(room);

  /**
   * Performs an RPC call to the agent participant
   * @param method - The RPC method name
   * @param payload - The payload to send (will be stringified if object)
   * @param options - Optional configuration
   * @returns The response from the RPC call
   */
  const performAgentRPC = useCallback(
    async <T = unknown>(
      method: string,
      payload: unknown,
    ): Promise<T | undefined> => {
      try {
        const agent = findAgentParticipant();

        if (!agent?.identity) {
          const error = new Error("No agent participant found for RPC message");
          console.error(error);
          return undefined;
        }

        const response = await room.localParticipant?.performRpc({
          destinationIdentity: agent.identity,
          method,
          payload:
            typeof payload === "string" ? payload : JSON.stringify(payload),
        });

        return response as T;
      } catch (error) {
        console.error(`Failed to perform RPC call [${method}]:`, error);
        return undefined;
      }
    },
    [room, findAgentParticipant],
  );

  return { performAgentRPC, findAgentParticipant };
};
