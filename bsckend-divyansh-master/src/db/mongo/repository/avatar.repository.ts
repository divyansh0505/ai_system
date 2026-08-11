import type { ClientSession, FilterQuery } from 'mongoose';

import { AvatarModel } from '../models/avatar.model';
import type { Avatar, AVATAR_PROVIDER, GENDER } from '../models/types';

export interface CreateAvatarDto {
  name: string;
  description?: string;
  display_image?: string;
  gender?: GENDER;
  provider: AVATAR_PROVIDER;
  external_id: string;
  is_custom_generated?: boolean;
  is_active?: boolean;
}

export class AvatarRepository {
  static async get(filter: FilterQuery<Avatar>): Promise<Avatar | null> {
    return await AvatarModel.findOne(filter).lean();
  }

  static async getMany(filter: FilterQuery<Avatar>): Promise<Avatar[]> {
    return await AvatarModel.find(filter).lean();
  }

  static async create(
    data: CreateAvatarDto,
    session?: ClientSession,
  ): Promise<Avatar> {
    const [avatar] = await AvatarModel.create([data], { session });
    return avatar;
  }

  static async update(
    filter: FilterQuery<Avatar>,
    data: Partial<CreateAvatarDto>,
    session?: ClientSession,
  ): Promise<Avatar | null> {
    return (await AvatarModel.findOneAndUpdate(filter, data, {
      new: true,
      session,
    }).lean()) as Avatar | null;
  }
}
