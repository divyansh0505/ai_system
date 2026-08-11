import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationFlowsModel } from '../models/organization_flows.model';
import type { OrganizationFlows } from '../models/types';
import type {
  CreateOrganizationFlowsDto,
  UpdateOrganizationFlowsDto,
} from '../../../services/types/organization_flows.types';

export class OrganizationFlowsRepository {
  static async get(
    filter: FilterQuery<OrganizationFlows>,
  ): Promise<OrganizationFlows | null> {
    return await OrganizationFlowsModel.findOne(filter).lean();
  }

  static async getMany(
    filter: FilterQuery<OrganizationFlows>,
  ): Promise<OrganizationFlows[]> {
    return await OrganizationFlowsModel.find(filter).lean();
  }

  static async create(
    data: CreateOrganizationFlowsDto,
    session?: ClientSession,
  ): Promise<OrganizationFlows> {
    const [organizationFlows] = await OrganizationFlowsModel.create([data], {
      session,
    });
    return organizationFlows;
  }

  static async update(
    filter: FilterQuery<OrganizationFlows>,
    data: UpdateOrganizationFlowsDto,
    session?: ClientSession,
  ): Promise<OrganizationFlows | null> {
    return await OrganizationFlowsModel.findOneAndUpdate(filter, data, {
      session,
      new: true,
    });
  }
}
