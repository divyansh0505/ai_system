export interface HubspotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  phone?: string;
  website?: string;
  jobtitle?: string;
  city?: string;
  country?: string;
  ip_address?: string;
  hs_analytics_source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_term?: string;
  hubspot_owner_id?: string;
  compliances_interested_in?: string;
}

export interface HubspotContactResponse {
  id: string;
  properties: HubspotContactProperties;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface SessionToHubspotData {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  phone?: string;
  website?: string;
  jobtitle?: string;
  city?: string;
  country?: string;
  ip_address?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_term?: string;
  notes?: string;
  transcript_summary?: string;
  is_icp?: boolean | string;
  intent?: string;
  compliances_interested_in?: string;
}

export interface HubspotTokenStatusResponse {
  is_active: boolean;
  created_at?: Date;
  form_id?: string | null;
}

// HubSpot Notes (Engagement) types
export interface HubspotNoteProperties {
  hs_note_body: string;
  hs_timestamp?: string;
}

export interface HubspotNoteAssociation {
  to: { id: string };
  types: Array<{
    associationCategory: 'HUBSPOT_DEFINED';
    associationTypeId: number;
  }>;
}

export interface HubspotNoteCreateRequest {
  properties: HubspotNoteProperties;
  associations?: HubspotNoteAssociation[];
}

export interface HubspotNoteResponse {
  id: string;
  properties: HubspotNoteProperties;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

