import type { FilterQuery } from 'mongoose';

import { SessionModel } from '../models/session.model';
import type { Session } from '../models/types';
import type {
  CreateSessionDto,
  UpdateSessionDto,
  GetSessionsOptionsDto,
} from '../../../services/types/session.types';

export class SessionRepository {
  static async get(
    filter: FilterQuery<Session>,
    populate?: string[],
  ): Promise<Session | null> {
    let query = SessionModel.findOne(filter);
    if (populate) {
      for (const field of populate) {
        query = query.populate(field);
      }
    }
    return (await query.lean()) as unknown as Session | null;
  }

  static async getMany(
    filter: FilterQuery<Session>,
    options?: GetSessionsOptionsDto,
  ): Promise<Session[]> {
    let query = SessionModel.find(filter);
    if (options?.sortField) {
      query = query.sort({ [options.sortField]: options.sortOrder ?? -1 });
    }
    if (options?.offset) {
      query = query.skip(options.offset);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    return (await query.lean()) as unknown as Session[];
  }

  static async create(session: CreateSessionDto): Promise<Session | null> {
    return await SessionModel.create(session);
  }

  static async update(
    filter: FilterQuery<Session>,
    updateData: UpdateSessionDto,
  ): Promise<Session | null> {
    return (await SessionModel.findOneAndUpdate(filter, updateData, {
      new: true,
    }).lean()) as unknown as Session | null;
  }

  static async count(filter: FilterQuery<Session>): Promise<number> {
    return await SessionModel.countDocuments(filter);
  }

  static async distinct<T = unknown>(
    field: string,
    filter: FilterQuery<Session>,
  ): Promise<T[]> {
    return await SessionModel.distinct(field, filter);
  }
}
