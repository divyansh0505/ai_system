import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationModel } from '../models/organization.model';
import type { Organization } from '../models/types';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../../../services/types/organization.types';

export class OrganizationRepository {
  static async get(
    filter: FilterQuery<Organization>,
  ): Promise<Organization | null> {
    return (await OrganizationModel.findOne(
      filter,
    ).lean()) as Organization | null;
  }

  static async getMany(
    filter: FilterQuery<Organization>,
  ): Promise<Organization[] | null> {
    return (await OrganizationModel.find(filter).lean()) as unknown as
      | Organization[]
      | null;
  }

  static async create(
    organization: CreateOrganizationDto,
    session?: ClientSession,
  ): Promise<Organization | null> {
    const [createdOrg] = await OrganizationModel.create([organization], {
      session,
    });
    return createdOrg;
  }

  static async update(
    filter: FilterQuery<Organization>,
    updateData: UpdateOrganizationDto,
    session?: ClientSession,
  ): Promise<Organization | null> {
    return (await OrganizationModel.findOneAndUpdate(filter, updateData, {
      new: true,
      session,
    }).lean()) as Organization | null;
  }
}
