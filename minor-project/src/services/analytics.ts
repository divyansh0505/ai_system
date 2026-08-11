import posthog from "posthog-js";

/**
 * Analytics Events for PostHog tracking
 * These events map to the dashboard metrics shown in the requirements
 */

export const ANALYTICS_EVENTS = {
  // Session Lifecycle
  SESSION_STARTED: "session_started",
  SESSION_ENDED: "session_ended",
  SESSION_ABANDONED: "session_abandoned",

  // Widget Lifecycle
  WIDGET_OPENED: "widget_opened",
  WIDGET_CLOSED: "widget_closed",

  // User Journey
  INTRO_VIEWED: "intro_viewed",
  COMPLIANCE_DIALOG_SHOWN: "compliance_dialog_shown",
  COMPLIANCE_ACCEPTED: "compliance_accepted",
  COMPLIANCE_REJECTED: "compliance_rejected",

  // LiveKit Connection
  LIVEKIT_CONNECTING: "livekit_connecting",
  LIVEKIT_CONNECTED: "livekit_connected",
  LIVEKIT_DISCONNECTED: "livekit_disconnected",
  LIVEKIT_CONNECTION_FAILED: "livekit_connection_failed",
  LIVEKIT_RECONNECTING: "livekit_reconnecting",

  // Audio/Video Events
  MICROPHONE_ENABLED: "microphone_enabled",
  MICROPHONE_DISABLED: "microphone_disabled",
  AGENT_MUTED: "agent_muted",
  AGENT_UNMUTED: "agent_unmuted",
  VIDEO_TRACK_RECEIVED: "video_track_received",
  AUDIO_TRACK_RECEIVED: "audio_track_received",

  // Agent Interaction
  AGENT_SPEAKING: "agent_speaking",
  AGENT_LISTENING: "agent_listening",
  AGENT_THINKING: "agent_thinking",
  AGENT_IDLE: "agent_idle",

  // Messaging
  MESSAGE_SENT: "message_sent",
  MESSAGE_RECEIVED: "message_received",

  // Tool Usage
  TOOL_INVOKED: "tool_invoked",
  CALENDAR_OPENED: "calendar_opened",
  CALENDAR_CLOSED: "calendar_closed",
  DEMO_STARTED: "demo_started",
  DEMO_COMPLETED: "demo_completed",

  // Calendar Provider Events (provider-agnostic)
  CALENDAR_PAGE_VIEWED: "calendar_page_viewed",
  CALENDAR_DATE_SELECTED: "calendar_date_selected",
  CALENDAR_EVENT_TYPE_VIEWED: "calendar_event_type_viewed",
  CALENDAR_MEETING_BOOKED: "calendar_meeting_booked",
  CALENDAR_MEETING_RESCHEDULED: "calendar_meeting_rescheduled",
  CALENDAR_PROSPECT_DISQUALIFIED: "calendar_prospect_disqualified",

  // User Actions
  TALK_TO_HUMAN_CLICKED: "talk_to_human_clicked",
  END_CALL_CLICKED: "end_call_clicked",

  // Errors
  ERROR_OCCURRED: "error_occurred",
  AUDIO_PERMISSION_DENIED: "audio_permission_denied",
  CONNECTION_ERROR: "connection_error",
} as const;

// ============================================
// Session Status (for tracking success/failure)
// ============================================

export enum SessionStatus {
  SUCCESS = "success",
  FAILED = "failed",
  ABANDONED = "abandoned",
  UNKNOWN = "unknown",
}

// ============================================
// Analytics Service
// ============================================

class AnalyticsService {
  private sessionStartTime: number | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private pageViewCount: number = 0;
  private messageCount: number = 0;
  private launcherSource: string | null = null;

  /**
   * Initialize PostHog with user identification
   */
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.isPostHogAvailable()) return;

    this.userId = userId;
    posthog.identify(userId, properties);
  }

  /**
   * Set user properties (email, name, etc.)
   * @param properties - Properties to set (can be overwritten)
   * @param propertiesSetOnce - Properties to set only once (first-touch, won't overwrite)
   */
  setUserProperties(
    properties?: Record<string, any>,
    propertiesSetOnce?: Record<string, any>,
  ) {
    if (!this.isPostHogAvailable()) return;

    posthog.setPersonProperties(properties, propertiesSetOnce);
  }

  /**
   * Track session start
   */
  startSession(sessionId: string, metadata?: Record<string, any>) {
    if (!this.isPostHogAvailable()) return;

    this.sessionId = sessionId;
    this.sessionStartTime = Date.now();
    this.pageViewCount = 0;
    this.messageCount = 0;

    posthog.capture(ANALYTICS_EVENTS.SESSION_STARTED, {
      session_id: sessionId,
      posthog_session_id: posthog.get_session_id(),
      timestamp: this.sessionStartTime,
      launcher_source: this.launcherSource || "unknown",
      ...metadata,
    });

    // Start session recording if available
    posthog.startSessionRecording();
  }

  /**
   * Track session end with status and metadata
   */
  endSession(status: SessionStatus, metadata?: Record<string, any>) {
    if (!this.isPostHogAvailable() || !this.sessionId) return;

    const sessionDuration = this.sessionStartTime
      ? (Date.now() - this.sessionStartTime) / 1000
      : 0;

    posthog.capture(ANALYTICS_EVENTS.SESSION_ENDED, {
      session_id: this.sessionId,
      session_duration: sessionDuration,
      session_status: status,
      page_views: this.pageViewCount,
      messages_sent: this.messageCount,
      timestamp: Date.now(),
      ...metadata,
    });

    // Stop session recording
    posthog.stopSessionRecording();

    // Reset session state
    this.sessionStartTime = null;
    this.sessionId = null;
    this.launcherSource = null;
  }

  /**
   * Track widget open/close
   */
  trackWidgetOpen(launcherSource?: string) {
    if (!this.isPostHogAvailable()) return;

    this.launcherSource = launcherSource || "unknown";
    this.pageViewCount++;
    posthog.capture(ANALYTICS_EVENTS.WIDGET_OPENED, {
      session_id: this.sessionId,
      timestamp: Date.now(),
      launcher_source: launcherSource || "unknown",
    });
  }

  trackWidgetClose() {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(ANALYTICS_EVENTS.WIDGET_CLOSED, {
      session_id: this.sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Track LiveKit connection events
   */
  trackLivekitConnection(event: string, metadata?: Record<string, any>) {
    if (!this.isPostHogAvailable()) return;

    const eventMap: Record<string, string> = {
      connecting: ANALYTICS_EVENTS.LIVEKIT_CONNECTING,
      connected: ANALYTICS_EVENTS.LIVEKIT_CONNECTED,
      disconnected: ANALYTICS_EVENTS.LIVEKIT_DISCONNECTED,
      reconnecting: ANALYTICS_EVENTS.LIVEKIT_RECONNECTING,
    };

    const eventName = eventMap[event] || event;

    posthog.capture(eventName, {
      session_id: this.sessionId,
      connection_state: event,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Track microphone toggle
   */
  trackMicrophoneToggle(enabled: boolean) {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(
      enabled
        ? ANALYTICS_EVENTS.MICROPHONE_ENABLED
        : ANALYTICS_EVENTS.MICROPHONE_DISABLED,
      {
        session_id: this.sessionId,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Track agent mute/unmute
   */
  trackAgentMute(muted: boolean) {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(
      muted ? ANALYTICS_EVENTS.AGENT_MUTED : ANALYTICS_EVENTS.AGENT_UNMUTED,
      {
        session_id: this.sessionId,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Track agent state changes
   */
  trackAgentState(state: string) {
    if (!this.isPostHogAvailable()) return;

    const stateMap: Record<string, string> = {
      speaking: ANALYTICS_EVENTS.AGENT_SPEAKING,
      listening: ANALYTICS_EVENTS.AGENT_LISTENING,
      thinking: ANALYTICS_EVENTS.AGENT_THINKING,
      idle: ANALYTICS_EVENTS.AGENT_IDLE,
    };

    const eventName = stateMap[state] || `agent_state_${state}`;

    posthog.capture(eventName, {
      session_id: this.sessionId,
      agent_state: state,
      timestamp: Date.now(),
    });
  }

  /**
   * Track message sent/received
   */
  trackMessage(
    type: "sent" | "received",
    message: string,
    metadata?: Record<string, any>,
  ) {
    if (!this.isPostHogAvailable()) return;

    if (type === "sent") {
      this.messageCount++;
    }

    posthog.capture(
      type === "sent"
        ? ANALYTICS_EVENTS.MESSAGE_SENT
        : ANALYTICS_EVENTS.MESSAGE_RECEIVED,
      {
        session_id: this.sessionId,
        message_length: message.length,
        message_word_count: message.split(/\s+/).length,
        timestamp: Date.now(),
        ...metadata,
      },
    );
  }

  /**
   * Track tool invocation
   */
  trackToolInvocation(toolName: string, metadata?: Record<string, any>) {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(ANALYTICS_EVENTS.TOOL_INVOKED, {
      session_id: this.sessionId,
      tool_name: toolName,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Track calendar open/close
   */
  trackCalendar(action: "opened" | "closed") {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(
      action === "opened"
        ? ANALYTICS_EVENTS.CALENDAR_OPENED
        : ANALYTICS_EVENTS.CALENDAR_CLOSED,
      {
        session_id: this.sessionId,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Track calendar provider events (provider-agnostic).
   * Both Calendly and Revenue Hero fire these same PostHog events;
   * the `provider` property distinguishes the source.
   */
  trackCalendarProviderEvent(
    provider: "calendly" | "revenue-hero",
    eventType:
      | "page_viewed"
      | "date_selected"
      | "event_type_viewed"
      | "meeting_booked"
      | "meeting_rescheduled"
      | "prospect_disqualified",
    payload?: Record<string, any>,
  ) {
    if (!this.isPostHogAvailable()) return;

    const eventMap = {
      page_viewed: ANALYTICS_EVENTS.CALENDAR_PAGE_VIEWED,
      date_selected: ANALYTICS_EVENTS.CALENDAR_DATE_SELECTED,
      event_type_viewed: ANALYTICS_EVENTS.CALENDAR_EVENT_TYPE_VIEWED,
      meeting_booked: ANALYTICS_EVENTS.CALENDAR_MEETING_BOOKED,
      meeting_rescheduled: ANALYTICS_EVENTS.CALENDAR_MEETING_RESCHEDULED,
      prospect_disqualified: ANALYTICS_EVENTS.CALENDAR_PROSPECT_DISQUALIFIED,
    };

    posthog.capture(eventMap[eventType], {
      session_id: this.sessionId,
      provider,
      timestamp: Date.now(),
      ...payload,
    });
  }

  /**
   * Track demo interactions
   */
  trackDemo(action: "started" | "completed", metadata?: Record<string, any>) {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(
      action === "started"
        ? ANALYTICS_EVENTS.DEMO_STARTED
        : ANALYTICS_EVENTS.DEMO_COMPLETED,
      {
        session_id: this.sessionId,
        timestamp: Date.now(),
        ...metadata,
      },
    );
  }

  /**
   * Track compliance dialog actions
   */
  trackCompliance(action: "shown" | "accepted" | "rejected") {
    if (!this.isPostHogAvailable()) return;

    const eventMap = {
      shown: ANALYTICS_EVENTS.COMPLIANCE_DIALOG_SHOWN,
      accepted: ANALYTICS_EVENTS.COMPLIANCE_ACCEPTED,
      rejected: ANALYTICS_EVENTS.COMPLIANCE_REJECTED,
    };

    posthog.capture(eventMap[action], {
      session_id: this.sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Track errors
   */
  trackError(
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, any>,
  ) {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      session_id: this.sessionId,
      error_type: errorType,
      error_message: errorMessage,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isPostHogAvailable()) return;

    posthog.capture(eventName, {
      session_id: this.sessionId,
      timestamp: Date.now(),
      ...properties,
    });
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      sessionStartTime: this.sessionStartTime,
      sessionDuration: this.sessionStartTime
        ? (Date.now() - this.sessionStartTime) / 1000
        : 0,
      pageViewCount: this.pageViewCount,
      messageCount: this.messageCount,
    };
  }

  /**
   * Check if PostHog is available
   */
  private isPostHogAvailable(): boolean {
    return typeof posthog !== "undefined" && posthog.__loaded;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export for testing
export { AnalyticsService };
