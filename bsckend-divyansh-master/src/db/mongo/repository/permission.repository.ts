import type { FilterQuery } from 'mongoose';

import { PermissionModel } from '../models/permission.model';
import type { Permission } from '../models/types';

export class PermissionRepository {
  static async get(
    filter: FilterQuery<Permission>,
  ): Promise<Permission | null> {
    return await PermissionModel.findOne(filter).lean();
  }

  static async getMany(filter: FilterQuery<Permission>): Promise<Permission[]> {
    return await PermissionModel.find(filter).lean();
  }

  static async create(
    permission: Partial<Permission>,
  ): Promise<Permission | null> {
    return await PermissionModel.create(permission);
  }

  static async update(
    filter: FilterQuery<Permission>,
    updateData: Partial<Permission>,
  ): Promise<Permission | null> {
    return await PermissionModel.findOneAndUpdate(filter, updateData, {
      new: true,
    }).lean();
  }
}
