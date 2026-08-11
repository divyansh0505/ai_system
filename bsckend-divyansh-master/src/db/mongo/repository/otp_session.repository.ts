import type { ClientSession, FilterQuery } from 'mongoose';

import { OtpSessionModel } from '../models/otp_session.model';
import type { OtpSession } from '../models/types';
import type {
  CreateOtpSessionDto,
  UpdateOtpSessionDto,
} from '../../../services/types/otp_session.types';

export class OtpSessionRepository {
  static async get(
    filter: FilterQuery<OtpSession>,
  ): Promise<OtpSession | null> {
    return (await OtpSessionModel.findOne(filter)
      .sort({
        created_at: -1,
      })
      .lean()) as unknown as OtpSession | null;
  }

  static async create(
    otpSessionData: CreateOtpSessionDto,
    session?: ClientSession,
  ): Promise<OtpSession | null> {
    const [createdSession] = await OtpSessionModel.create([otpSessionData], {
      session,
    });
    return createdSession;
  }

  static async update(
    filter: FilterQuery<OtpSession>,
    updateData: UpdateOtpSessionDto,
    session?: ClientSession,
  ): Promise<OtpSession | null> {
    return (await OtpSessionModel.findOneAndUpdate(filter, updateData, {
      new: true,
      session,
    }).lean()) as OtpSession | null;
  }
}
