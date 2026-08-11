import type { ClientSession, FilterQuery, Types } from 'mongoose';

import { OrganizationVoiceModel } from '../models/organization_voice.model';
import type { OrganizationVoice } from '../models/types';

export interface CreateOrganizationVoiceDto {
  organization_id: Types.ObjectId | string;
  voice_id: Types.ObjectId | string;
  is_active?: boolean;
}

export class OrganizationVoiceRepository {
  static async get(
    filter: FilterQuery<OrganizationVoice>,
  ): Promise<OrganizationVoice | null> {
    return await OrganizationVoiceModel.findOne(filter).lean();
  }

  static async getMany(
    filter: FilterQuery<OrganizationVoice>,
    populate?: string[],
  ): Promise<OrganizationVoice[]> {
    let query = OrganizationVoiceModel.find(filter);
    if (populate) {
      for (const field of populate) {
        query = query.populate(field);
      }
    }
    return await query.lean();
  }

  static async exists(
    filter: FilterQuery<OrganizationVoice>,
  ): Promise<boolean> {
    const result = await OrganizationVoiceModel.exists(filter);
    return result !== null;
  }

  static async create(
    data: CreateOrganizationVoiceDto,
    session?: ClientSession,
  ): Promise<OrganizationVoice> {
    const [organizationVoice] = await OrganizationVoiceModel.create([data], {
      session,
    });
    return organizationVoice;
  }

  static async update(
    filter: FilterQuery<OrganizationVoice>,
    data: Partial<CreateOrganizationVoiceDto>,
    session?: ClientSession,
  ): Promise<OrganizationVoice | null> {
    return (await OrganizationVoiceModel.findOneAndUpdate(filter, data, {
      new: true,
      session,
    }).lean()) as OrganizationVoice | null;
  }
}
