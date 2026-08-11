import type { Session, User } from '../../db/mongo/models/types';
import { INPUT_TYPE, MESSAGE_BY } from '../../db/mongo/models/types';
import logger from '../../utils/logger';

// IST timezone offset (UTC+5:30) in milliseconds
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export enum SheetDataType {
  SPRINTO = 'sprinto',
}

export interface SprintoData {
  date: string;
  time: string;
  email: string;
  ip: string;
  country: string;
  city: string;
  compliance_interested_in: string;
  notes: string;
  hubspotutk: string;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_term: string;
  current_url: string;
  gclid: string;
}

function formatDateIST(date: Date): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const day = istDate.getUTCDate();
  const month = istDate.toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  });
  const year = istDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function formatTimeIST(date: Date): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const hours = istDate.getUTCHours().toString().padStart(2, '0');
  const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function prepareAndConvertForSheets(
  organizationName: SheetDataType,
  session: Session,
  user: User | null,
): Record<string, unknown> {
  let rawData: Record<string, unknown> = {};

  if (organizationName === SheetDataType.SPRINTO) {
    const preferences: string[] = [];

    if (session.input && Array.isArray(session.input)) {
      for (const item of session.input) {
        if (item.type === INPUT_TYPE.PREFERENCES) {
          preferences.push(item.answer);
        }
      }
    }

    let dateStr: string | null = null;
    let timeStr: string | null = null;

    if (session.created_at) {
      dateStr = formatDateIST(session.created_at);
      timeStr = formatTimeIST(session.created_at);
    }

    const humanMessages: string[] = [];

    if (session.transcript && Array.isArray(session.transcript)) {
      for (const transcriptItem of session.transcript) {
        if (transcriptItem.message_by === MESSAGE_BY.HUMAN) {
          humanMessages.push(transcriptItem.message);
        }
      }
    }

    rawData = {
      date: dateStr,
      time: timeStr,
      email: user?.email || null,
      ip: session.visitor_ip || null,
      country: session.visitor_country || null,
      city: session.visitor_city || '',
      compliance_interested_in:
        preferences.length > 0 ? preferences.join(', ') : null,
      notes: humanMessages.join('\n'),
      hubspotutk: session.hubspotutk || '',
      utm_campaign: session.visitor_utm_campaign || '',
      utm_source: session.visitor_utm_source || '',
      utm_medium: session.visitor_utm_medium || '',
      utm_term: session.visitor_utm_term || '',
      current_url: session.visitor_current_url || '',
      gclid: session.visitor_gclid || '',
    };

    logger.info('SHEETS_DATA_CONVERTER_RAW_DATA', { rawData });
  }

  const missingFields: string[] = [];

  for (const [key, value] of Object.entries(rawData)) {
    if (value === null) {
      missingFields.push(key);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Incomplete data for ${organizationName}: missing fields: ${missingFields.join(', ')}`,
    );
  }

  return rawData;
}
