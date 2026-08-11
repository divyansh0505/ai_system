import type { HubspotContactProperties } from '../../services/types/hubspot.types';

export interface HubspotSyncContact {
  email: string;
  properties: HubspotContactProperties;
  existingContactId?: string;
}

export interface HubspotSyncMessageData {
  organizationId: string;
  contact: HubspotSyncContact;
  encryptedAccessToken: string;
  retryCount?: number;
  // Form submission fields
  hubspotFormId?: string;
  hubspotutk?: string;
  pageUri?: string;
  compliancesInterestedIn?: string;
  // Note fields for transcript
  noteBody?: string;
  noteTimestamp?: string;
}

export interface HubspotSyncMessage {
  data: HubspotSyncMessageData;
}
