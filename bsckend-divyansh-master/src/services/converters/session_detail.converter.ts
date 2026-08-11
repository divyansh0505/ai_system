import type { Session, User } from '../../db/mongo/models/types';
import type {
  SessionDetailData,
  SessionDetailUserData,
} from '../types/dashboard.types';

export class SessionDetailConverter {
  static convert(session: Session, user: User | null): SessionDetailData {
    const userPreference = this.extractPreference(session.input);

    return {
      session_id: (session._id as { toString(): string }).toString(),
      organization_id: session.organization_id?.toString() || null,
      user_id: session.user_id?.toString() || null,
      session_duration: session.duration || null,
      user_preference: userPreference,
      is_meeting_booked: session.is_meeting_booked || false,
      total_chat_interactions: session.total_chat_interactions || 0,
      total_voice_interactions: session.total_voice_interactions || 0,
      total_demo_interactions: session.total_demo_interactions || null,
      voice_recording: session.voice_recording || null,
      transcript: session.transcript || null,
      transcript_summary: session.transcript_summary || null,
      is_icp: session.is_icp ?? null,
      qna_pairs: session.qna_pairs || null,
      visitor_country: session.visitor_country || null,
      visitor_subdivision: session.visitor_subdivision || null,
      visitor_city: session.visitor_city || null,
      visitor_utm_campaign: session.visitor_utm_campaign || null,
      visitor_utm_source: session.visitor_utm_source || null,
      visitor_utm_medium: session.visitor_utm_medium || null,
      visitor_utm_term: session.visitor_utm_term || null,
      visitor_current_url: session.visitor_current_url || null,
      intent: session.intent || null,
      user: user ? this.convertUser(user) : null,
    };
  }

  private static extractPreference(
    inputs: Array<{ type: string; answer: string }> | undefined,
  ): string | null {
    if (!inputs || inputs.length === 0) {
      return null;
    }

    for (const item of inputs) {
      if (item.type === 'preferences') {
        return item.answer;
      }
    }

    return null;
  }

  private static convertUser(user: User): SessionDetailUserData {
    return {
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      email: user.email || null,
      company_name: user.company_name || null,
      company_logo: user.company_logo || null,
      company_website: user.company_website || null,
      socials: user.socials || null,
      designation: user.designation || null,
    };
  }
}
