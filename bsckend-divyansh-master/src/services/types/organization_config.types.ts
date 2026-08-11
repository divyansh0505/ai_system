import type { Types } from 'mongoose';
import type { AgentConfig, HubspotConfig } from '../../db/mongo/models/types';

// ============ Repository DTOs ============

export interface CreateOrganizationConfigDto {
  organization_id?: Types.ObjectId;
  settings: Record<string, Record<string, unknown>>;
  agents?: AgentConfig[];
  navigation_graph?: string;
  starting_current_node?: string;
  hubspot?: HubspotConfig;
}

export interface UpdateOrganizationConfigDto {
  organization_id?: Types.ObjectId;
  settings?: Record<string, Record<string, unknown>>;
  agents?: AgentConfig[];
  navigation_graph?: string;
  starting_current_node?: string;
  hubspot?: HubspotConfig;
}

export interface OrganizationConfigFilterDto {
  _id?: string | Types.ObjectId;
  organization_id?: string | Types.ObjectId;
}
