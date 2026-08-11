import type { FilterQuery } from 'mongoose';

import { RoleModel } from '../models/role.model';
import type { Role } from '../models/types';

export class RoleRepository {
  static async get(filter: FilterQuery<Role>): Promise<Role | null> {
    return await RoleModel.findOne(filter).lean();
  }

  static async getMany(filter: FilterQuery<Role>): Promise<Role[]> {
    return await RoleModel.find(filter).lean();
  }

  static async create(role: Partial<Role>): Promise<Role | null> {
    return await RoleModel.create(role);
  }

  static async update(
    filter: FilterQuery<Role>,
    updateData: Partial<Role>,
  ): Promise<Role | null> {
    return await RoleModel.findOneAndUpdate(filter, updateData, {
      new: true,
    }).lean();
  }
}
