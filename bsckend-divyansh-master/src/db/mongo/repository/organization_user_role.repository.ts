import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationUserRoleModel } from '../models/organization_user_role.model';
import type { OrganizationUserRole } from '../models/types';
import type {
  CreateOrganizationUserRoleDto,
  UpdateOrganizationUserRoleDto,
} from '../../../services/types/organization_user.types';

export class OrganizationUserRoleRepository {
  static async get(
    filter: FilterQuery<OrganizationUserRole>,
  ): Promise<OrganizationUserRole | null> {
    return (await OrganizationUserRoleModel.findOne(
      filter,
    ).lean()) as OrganizationUserRole | null;
  }

  static async getMany(
    filter: FilterQuery<OrganizationUserRole>,
  ): Promise<OrganizationUserRole[]> {
    return (await OrganizationUserRoleModel.find(
      filter,
    ).lean()) as unknown as OrganizationUserRole[];
  }

  static async create(
    userRole: CreateOrganizationUserRoleDto,
    session?: ClientSession,
  ): Promise<OrganizationUserRole | null> {
    const [createdRole] = await OrganizationUserRoleModel.create([userRole], {
      session,
    });
    return createdRole;
  }

  static async update(
    filter: FilterQuery<OrganizationUserRole>,
    updateData: UpdateOrganizationUserRoleDto,
    session?: ClientSession,
  ): Promise<OrganizationUserRole | null> {
    return (await OrganizationUserRoleModel.findOneAndUpdate(
      filter,
      updateData,
      {
        new: true,
        session,
      },
    ).lean()) as OrganizationUserRole | null;
  }
}
