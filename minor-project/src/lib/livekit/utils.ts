import { ReceivedChatMessage, TextStreamData } from "@livekit/components-react";
import { Room } from "livekit-client";

// Audio permission utilities
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
    return true;
  } catch (error) {
    console.error("Microphone permission denied:", error);
    return false;
  }
};

export function transcriptionToChatMessage(
  textStream: TextStreamData,
  room: Room,
): ReceivedChatMessage {
  const participant =
    textStream.participantInfo.identity === room.localParticipant.identity
      ? room.localParticipant
      : Array.from(room.remoteParticipants.values()).find(
          (p) => p.identity === textStream.participantInfo.identity,
        );

  return {
    id: textStream.streamInfo.id as string,
    timestamp: textStream.streamInfo.timestamp as number,
    message: textStream.text,
    from: participant,
    attributes: textStream.streamInfo.attributes,
  } as ReceivedChatMessage;
}
