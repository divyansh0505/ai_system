import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationProjectModel } from '../models/organization_project.model';
import type { OrganizationProject } from '../models/types';
import type {
  CreateOrganizationProjectDto,
  UpdateOrganizationProjectDto,
} from '../../../services/types/organization_project.types';

export class OrganizationProjectRepository {
  static async get(
    filter: FilterQuery<OrganizationProject>,
    populate?: string[],
  ): Promise<OrganizationProject | null> {
    let query = OrganizationProjectModel.findOne(filter);
    if (populate) {
      for (const field of populate) {
        query = query.populate(field);
      }
    }
    return (await query.lean()) as OrganizationProject | null;
  }

  static async getMany(
    filter: FilterQuery<OrganizationProject>,
  ): Promise<OrganizationProject[] | null> {
    return (await OrganizationProjectModel.find(filter).lean()) as unknown as
      | OrganizationProject[]
      | null;
  }

  static async create(
    data: CreateOrganizationProjectDto,
    session?: ClientSession,
  ): Promise<OrganizationProject> {
    const [organizationProject] = await OrganizationProjectModel.create(
      [data],
      { session },
    );
    return organizationProject;
  }

  static async update(
    filter: FilterQuery<OrganizationProject>,
    updateData: UpdateOrganizationProjectDto,
    session?: ClientSession,
  ): Promise<OrganizationProject | null> {
    return (await OrganizationProjectModel.findOneAndUpdate(
      filter,
      updateData,
      {
        new: true,
        session,
      },
    ).lean()) as OrganizationProject | null;
  }

  static async delete(
    filter: FilterQuery<OrganizationProject>,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await OrganizationProjectModel.deleteOne(filter, {
      session,
    });
    return result.deletedCount > 0;
  }
}
