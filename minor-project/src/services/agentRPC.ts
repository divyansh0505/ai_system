import { Room, ParticipantKind } from "livekit-client";

// Module-level reference to the room (set via initAgentRPC)
let _room: Room | null = null;

/**
 * Initialize the agent RPC service with a LiveKit room
 * Should be called once when the room is connected
 */
export function initAgentRPC(room: Room): void {
  _room = room;
}

/**
 * Clean up the agent RPC service
 * Should be called when disconnecting from the room
 */
export function cleanupAgentRPC(): void {
  _room = null;
}

/**
 * Find the agent participant in the room
 */
function findAgentParticipant() {
  if (!_room) return undefined;

  return Array.from(_room.remoteParticipants.values()).find(
    (p) =>
      p.kind === ParticipantKind.AGENT &&
      !("lk.publish_on_behalf" in p.attributes),
  );
}

/**
 * Internal function to perform RPC calls
 */
async function performRPC<T = unknown>(
  method: string,
  payload: unknown,
): Promise<T | undefined> {
  try {
    if (!_room) {
      console.error("Agent RPC not initialized. Call initAgentRPC first.");
      return undefined;
    }

    const agent = findAgentParticipant();

    if (!agent?.identity) {
      console.error("No agent participant found for RPC message");
      return undefined;
    }

    const response = await _room.localParticipant?.performRpc({
      destinationIdentity: agent.identity,
      method,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload),
    });

    return response as T;
  } catch (error) {
    console.error(`Failed to perform RPC call [${method}]:`, error);
    return undefined;
  }
}

// Slides RPC Functions

/**
 * Navigate to a specific slide
 * @param slideNumber - 1-based slide number
 */
export async function navigateToSlide(slideNumber: number): Promise<void> {
  await performRPC("slideNavigation", { slide_number: slideNumber });
}

/**
 * Set the presentation state (play/pause agent narration)
 * @param state - "play" or "pause"
 */
export async function setPresentationState(
  state: "play" | "pause",
): Promise<void> {
  await performRPC("setPresentationState", { state });
}

/**
 * Start the presentation
 * @param message - Optional message to send to the agent
 */
export async function startPresentation(
  message: string = "Let's start the presentation",
): Promise<void> {
  await performRPC("PresentationStart", { user_message: message });
}

// Demo RPC Functions
/**
 * Notify agent that user clicked on a page element
 * @param selector - CSS selector of the clicked element
 */
export async function userClickedOnPage(selector: string): Promise<void> {
  await performRPC("userClickedOnPage", { selector });
}

// Calendar RPC Functions
/**
 * Notify agent that the user interacted with meeting booking
 * @param param0 - Object containing meeting booking state
 * @param param0.is_meeting_booked - Whether the meeting has been successfully booked
 */
export async function bookMeetingClicked({
  is_meeting_booked,
}: {
  is_meeting_booked: boolean;
}): Promise<void> {
  await performRPC("bookMeetingClicked", { is_meeting_booked });
}

// General RPC Functions

/**
 * Notify agent that user wants to talk to a human
 */
export async function talkToHumanClicked(): Promise<void> {
  await performRPC("talkToHumanClicked", {});
}

/**
 * Notify agent of a default flow change (onboarding completion)
 * @param data - User onboarding data
 */
export async function defaultFlowChange(data: {
  user_id: string | undefined;
  user_email: string;
  default_flow: string[] | null;
  hubspotutk: string | undefined;
}): Promise<void> {
  await performRPC("defaultFlowChange", data);
}

/**
 * Prompt the agent to ask the user for their email
 */
export async function promptForEmail(): Promise<void> {
  await performRPC("promptForEmail", {});
}
