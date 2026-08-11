import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationConfigModel } from '../models/organization_config.model';
import type { OrganizationConfig } from '../models/types';
import type {
  CreateOrganizationConfigDto,
  UpdateOrganizationConfigDto,
} from '../../../services/types/organization_config.types';

export class OrganizationConfigRepository {
  static async get(
    filter: FilterQuery<OrganizationConfig>,
  ): Promise<OrganizationConfig | null> {
    return (await OrganizationConfigModel.findOne(
      filter,
    ).lean()) as OrganizationConfig | null;
  }

  static async getMany(
    filter: FilterQuery<OrganizationConfig>,
  ): Promise<OrganizationConfig[]> {
    return (await OrganizationConfigModel.find(
      filter,
    ).lean()) as unknown as OrganizationConfig[];
  }

  static async create(
    config: CreateOrganizationConfigDto,
    session?: ClientSession,
  ): Promise<OrganizationConfig | null> {
    const [createdConfig] = await OrganizationConfigModel.create([config], {
      session,
    });
    return createdConfig;
  }

  static async update(
    filter: FilterQuery<OrganizationConfig>,
    updateData: UpdateOrganizationConfigDto,
    session?: ClientSession,
  ): Promise<OrganizationConfig | null> {
    return (await OrganizationConfigModel.findOneAndUpdate(filter, updateData, {
      new: true,
      session,
    }).lean()) as OrganizationConfig | null;
  }
}
