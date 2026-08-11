import type { ClientSession, FilterQuery } from 'mongoose';

import { VoiceModel } from '../models/voice.model';
import type { Voice, VOICE_PROVIDER, GENDER } from '../models/types';

export interface CreateVoiceDto {
  name: string;
  description?: string;
  gender?: GENDER;
  provider: VOICE_PROVIDER;
  external_id: string;
  playback_url?: string;
  is_custom_generated?: boolean;
  is_active?: boolean;
}

export class VoiceRepository {
  static async get(filter: FilterQuery<Voice>): Promise<Voice | null> {
    return await VoiceModel.findOne(filter).lean();
  }

  static async getMany(filter: FilterQuery<Voice>): Promise<Voice[]> {
    return await VoiceModel.find(filter).lean();
  }

  static async create(
    data: CreateVoiceDto,
    session?: ClientSession,
  ): Promise<Voice> {
    const [voice] = await VoiceModel.create([data], { session });
    return voice;
  }

  static async update(
    filter: FilterQuery<Voice>,
    data: Partial<CreateVoiceDto>,
    session?: ClientSession,
  ): Promise<Voice | null> {
    return (await VoiceModel.findOneAndUpdate(filter, data, {
      new: true,
      session,
    }).lean()) as Voice | null;
  }
}
