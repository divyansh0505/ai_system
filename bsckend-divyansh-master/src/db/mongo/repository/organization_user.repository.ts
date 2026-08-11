import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationUserModel } from '../models/organization_user.model';
import type { OrganizationUser } from '../models/types';
import type {
  CreateOrganizationUserDto,
  UpdateOrganizationUserDto,
} from '../../../services/types/organization_user.types';

export class OrganizationUserRepository {
  static async get(
    filter: FilterQuery<OrganizationUser>,
  ): Promise<OrganizationUser | null> {
    return (await OrganizationUserModel.findOne(
      filter,
    ).lean()) as OrganizationUser | null;
  }

  static async getMany(
    filter: FilterQuery<OrganizationUser>,
  ): Promise<OrganizationUser[]> {
    return (await OrganizationUserModel.find(
      filter,
    ).lean()) as unknown as OrganizationUser[];
  }

  static async create(
    user: CreateOrganizationUserDto,
    session?: ClientSession,
  ): Promise<OrganizationUser | null> {
    const [createdUser] = await OrganizationUserModel.create([user], {
      session,
    });
    return createdUser;
  }

  static async update(
    filter: FilterQuery<OrganizationUser>,
    updateData: UpdateOrganizationUserDto,
    session?: ClientSession,
  ): Promise<OrganizationUser | null> {
    return (await OrganizationUserModel.findOneAndUpdate(filter, updateData, {
      new: true,
      session,
    }).lean()) as OrganizationUser | null;
  }
}
