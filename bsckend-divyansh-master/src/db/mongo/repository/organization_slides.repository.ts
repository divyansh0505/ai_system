import type { ClientSession, FilterQuery } from 'mongoose';

import { OrganizationSlidesModel } from '../models/organization_slides.model';
import type { OrganizationSlides } from '../models/types';
import type {
  CreateOrganizationSlidesDto,
  UpdateOrganizationSlidesDto,
} from '../../../services/types/organization_slides.types';

export class OrganizationSlidesRepository {
  static async get(
    filter: FilterQuery<OrganizationSlides>,
  ): Promise<OrganizationSlides | null> {
    return (await OrganizationSlidesModel.findOne(
      filter,
    ).lean()) as OrganizationSlides | null;
  }

  static async getMany(
    filter: FilterQuery<OrganizationSlides>,
  ): Promise<OrganizationSlides[]> {
    return (await OrganizationSlidesModel.find(
      filter,
    ).lean()) as unknown as OrganizationSlides[];
  }

  static async create(
    data: CreateOrganizationSlidesDto,
    session?: ClientSession,
  ): Promise<OrganizationSlides> {
    const [organizationSlides] = await OrganizationSlidesModel.create([data], {
      session,
    });
    return organizationSlides;
  }

  static async update(
    filter: FilterQuery<OrganizationSlides>,
    updateData: UpdateOrganizationSlidesDto,
    session?: ClientSession,
  ): Promise<OrganizationSlides | null> {
    return (await OrganizationSlidesModel.findOneAndUpdate(filter, updateData, {
      new: true,
      session,
    }).lean()) as OrganizationSlides | null;
  }

  static async delete(
    filter: FilterQuery<OrganizationSlides>,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await OrganizationSlidesModel.deleteOne(filter, { session });
    return result.deletedCount > 0;
  }
}
