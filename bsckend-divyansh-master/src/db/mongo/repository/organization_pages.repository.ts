import type { FilterQuery } from 'mongoose';

import { OrganizationPagesModel } from '../models/organization_pages.model';
import type { OrganizationPages } from '../models/types';

export class OrganizationPagesRepository {
  static async get(
    filter: FilterQuery<OrganizationPages>,
  ): Promise<OrganizationPages | null> {
    return await OrganizationPagesModel.findOne(filter).lean();
  }

  static async getMany(
    filter: FilterQuery<OrganizationPages>,
  ): Promise<OrganizationPages[]> {
    return await OrganizationPagesModel.find(filter).lean();
  }

  static async countByIds(ids: string[]): Promise<number> {
    return await OrganizationPagesModel.countDocuments({
      _id: { $in: ids },
    });
  }
}
