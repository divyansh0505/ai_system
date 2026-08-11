import type { FilterQuery } from 'mongoose';

import { RequestLimiterModel } from '../models/request_limiter.model';
import type { RequestLimiter } from '../models/types';
import type { CreateRequestLimiterDto } from '../../../services/types/request_limiter.types';

export class RequestLimiterRepository {
  static async create(
    requestLimiterData: CreateRequestLimiterDto,
  ): Promise<RequestLimiter | null> {
    return await RequestLimiterModel.create(requestLimiterData);
  }

  static async getMany(filter: FilterQuery<RequestLimiter | null>) {
    return await RequestLimiterModel.find(filter).lean();
  }
}
