import type {
  SessionAnalyticsData,
  TranscriptEntry,
  UserInput,
} from '../types/session_analytics.types';
import { INPUT_TYPE } from '../../db/mongo/models/types';

export enum MessageBy {
  HUMAN = 'HUMAN',
  BOT = 'BOT',
}

export enum IntentLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

interface TranscriptItem {
  message: string;
  timestamp: string;
  message_by: string;
}

interface UserInputItem {
  type: string;
  question: string | null;
  answer: string;
}

export class SessionAnalyticsConverter {
  static convertTranscript(transcriptEntry: TranscriptEntry): TranscriptItem {
    let messageBy = MessageBy.HUMAN;
    const role = transcriptEntry.role.toUpperCase();

    if (['BOT', 'AGENT', 'ASSISTANT'].includes(role)) {
      messageBy = MessageBy.BOT;
    }

    return {
      message: transcriptEntry.content,
      timestamp: new Date().toISOString(),
      message_by: messageBy,
    };
  }

  static convertUserInput(userInput: UserInput): UserInputItem {
    return {
      type: INPUT_TYPE.PREFERENCES,
      question: userInput.question || null,
      answer: userInput.answer,
    };
  }

  static convertDemoInteractions(demo: { human: number; agent: number }): {
    human: number;
    bot: number;
  } {
    return {
      human: demo.human || 0,
      bot: demo.agent || 0,
    };
  }

  static calculateIntent(
    hasEmail: boolean,
    durationSeconds: number,
  ): IntentLevel {
    if (hasEmail || durationSeconds >= 60) {
      return IntentLevel.HIGH;
    } else if (durationSeconds >= 30 && durationSeconds < 60) {
      return IntentLevel.MEDIUM;
    }
    return IntentLevel.LOW;
  }

  static toSessionUpdateData(
    analyticsData: SessionAnalyticsData,
  ): Record<string, unknown> {
    const transcripts = analyticsData.transcripts.map((t) =>
      this.convertTranscript(t),
    );

    const userInputs = analyticsData.user_inputs.map((ui) =>
      this.convertUserInput(ui),
    );

    const demoInteractions = this.convertDemoInteractions(
      analyticsData.interactions.demo,
    );

    const hasEmail = Boolean(analyticsData.user_email);
    const duration = analyticsData.duration || 0;
    const intent = this.calculateIntent(hasEmail, duration);

    const updateData: Record<string, unknown> = {
      total_chat_interactions: analyticsData.interactions.chat,
      total_voice_interactions: analyticsData.interactions.voice,
      total_demo_interactions: demoInteractions,
      transcript: transcripts,
      input: userInputs,
      updated_at: new Date(),
      duration: analyticsData.duration,
      is_active: false,
      hubspotutk: analyticsData.hubspotutk || '',
      is_meeting_booked: analyticsData.is_meeting_booked ?? false,
      intent,
    };

    if (analyticsData.audio_url) {
      updateData.voice_recording = analyticsData.audio_url;
    }

    if (
      analyticsData.slide_analytics &&
      analyticsData.slide_analytics.length > 0
    ) {
      updateData.slide_analytics = analyticsData.slide_analytics;
    }

    return updateData;
  }
}
