import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationSharableLinkModel } from '../models/organization_sharable_link.model';
import type { OrganizationSharableLink } from '../models/types';
import type {
  CreateOrganizationSharableLinkDto,
  UpdateOrganizationSharableLinkDto,
} from '../../../services/types/organization_sharable_link.types';

export class OrganizationSharableLinkRepository {
  static async get(
    filter: FilterQuery<OrganizationSharableLink>,
  ): Promise<OrganizationSharableLink | null> {
    return await OrganizationSharableLinkModel.findOne(filter).lean();
  }

  static async getMany(
    filter: FilterQuery<OrganizationSharableLink>,
  ): Promise<OrganizationSharableLink[]> {
    return await OrganizationSharableLinkModel.find(filter).lean();
  }

  static async create(
    data: CreateOrganizationSharableLinkDto,
    session?: ClientSession,
  ): Promise<OrganizationSharableLink> {
    const [sharableLink] = await OrganizationSharableLinkModel.create([data], {
      session,
    });
    return sharableLink;
  }

  static async update(
    filter: FilterQuery<OrganizationSharableLink>,
    updateData: UpdateOrganizationSharableLinkDto,
    session?: ClientSession,
  ): Promise<OrganizationSharableLink | null> {
    return await OrganizationSharableLinkModel.findOneAndUpdate(
      filter,
      updateData,
      {
        new: true,
        session,
      },
    ).lean();
  }

  static async exists(
    filter: FilterQuery<OrganizationSharableLink>,
  ): Promise<boolean> {
    const count = await OrganizationSharableLinkModel.countDocuments(filter);
    return count > 0;
  }
}
