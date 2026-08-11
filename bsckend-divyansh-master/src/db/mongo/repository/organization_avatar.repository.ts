import type { ClientSession, FilterQuery, Types } from 'mongoose';

import { OrganizationAvatarModel } from '../models/organization_avatar.model';
import type { OrganizationAvatar } from '../models/types';

export interface CreateOrganizationAvatarDto {
  organization_id: Types.ObjectId | string;
  avatar_id: Types.ObjectId | string;
  is_active?: boolean;
}

export class OrganizationAvatarRepository {
  static async get(
    filter: FilterQuery<OrganizationAvatar>,
  ): Promise<OrganizationAvatar | null> {
    return (await OrganizationAvatarModel.findOne(
      filter,
    ).lean()) as OrganizationAvatar | null;
  }

  static async getMany(
    filter: FilterQuery<OrganizationAvatar>,
    populate?: string[],
  ): Promise<OrganizationAvatar[]> {
    let query = OrganizationAvatarModel.find(filter);
    if (populate) {
      for (const field of populate) {
        query = query.populate(field);
      }
    }
    return (await query.lean()) as unknown as OrganizationAvatar[];
  }

  static async exists(
    filter: FilterQuery<OrganizationAvatar>,
  ): Promise<boolean> {
    const result = await OrganizationAvatarModel.exists(filter);
    return result !== null;
  }

  static async create(
    data: CreateOrganizationAvatarDto,
    session?: ClientSession,
  ): Promise<OrganizationAvatar> {
    const [organizationAvatar] = await OrganizationAvatarModel.create([data], {
      session,
    });
    return organizationAvatar;
  }

  static async update(
    filter: FilterQuery<OrganizationAvatar>,
    data: Partial<CreateOrganizationAvatarDto>,
    session?: ClientSession,
  ): Promise<OrganizationAvatar | null> {
    return (await OrganizationAvatarModel.findOneAndUpdate(filter, data, {
      new: true,
      session,
    }).lean()) as OrganizationAvatar | null;
  }
}
