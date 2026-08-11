import FormData from 'form-data';
import mongoose, { Types } from 'mongoose';

import { config } from '../../config';
import {
  AvatarRepository,
  OrganizationAvatarRepository,
  OrganizationRepository,
} from '../db/mongo/repository';
import { AVATAR_PROVIDER } from '../db/mongo/models/types';
import type { Avatar, Organization } from '../db/mongo/models/types';
import { AxiosUtils } from '../utils/axios';
import logger from '../utils/logger';
import type { ServiceError, OrganizationAvatarItem } from './types';
import { OrganizationAvatarConverter } from './converters/organization_avatar.converter';

export interface CreateCustomAvatarRequest {
  display_name: string;
}

export interface CreateCustomAvatarResponse {
  avatar_id: string;
  name: string;
  external_id: string;
  provider: AVATAR_PROVIDER;
  display_image?: string;
}

export interface DeleteAvatarResponse {
  avatar_id: string;
  deleted: boolean;
}

interface AnamAvatarResponse {
  id: string;
  displayName: string;
  variantName?: string;
  imageUrl: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdByOrganizationId: string;
  availableVersions: string[];
  activeVersion: string;
}

interface ValidateCreateAvatarResult {
  organization: Organization;
}

interface ValidateDeleteAvatarResult {
  external_id: string;
}

export class OrganizationAvatarService {
  static async createCustomAvatar(
    organization_id: string,
    customAvatarDataRequest: CreateCustomAvatarRequest,
    image_file?: Express.Multer.File,
  ): Promise<Avatar | ServiceError> {
    logger.info('CREATE_CUSTOM_AVATAR', {
      organization_id,
      display_name: customAvatarDataRequest.display_name,
      hasImageFile: !!image_file,
    });

    const validationResult =
      await OrganizationAvatarValidator.validateCreateAvatar(
        organization_id,
        customAvatarDataRequest,
        image_file,
      );

    if ('code' in validationResult) {
      return validationResult;
    }

    // Call Anam API to create avatar
    const anamResponse = await this.callAnamApi(
      customAvatarDataRequest,
      image_file,
    );

    logger.info('ANAM_API_RESPONSE', { anamResponse });

    if ('code' in anamResponse) {
      return anamResponse;
    }

    // Use transaction for atomic creation
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Create avatar in database using configured default provider
      const avatar = await AvatarRepository.create(
        {
          name: customAvatarDataRequest.display_name,
          provider: config.customAvatar.defaultProvider as AVATAR_PROVIDER,
          external_id: anamResponse.id,
          display_image: anamResponse.imageUrl,
          is_custom_generated: true,
          is_active: true,
        },
        session,
      );

      // Create organization-avatar relationship
      await OrganizationAvatarRepository.create(
        {
          organization_id: organization_id,
          avatar_id: (avatar._id as Types.ObjectId).toString(),
          is_active: true,
        },
        session,
      );

      await session.commitTransaction();
      session.endSession();

      logger.info('CUSTOM_AVATAR_CREATED', {
        organization_id,
        avatar_id: (avatar._id as Types.ObjectId).toString(),
        external_id: anamResponse.id,
      });

      return avatar;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error('AVATAR_CREATE_FAILED', { organization_id, error });
      return { code: 500, message: 'Failed to create avatar' };
    }
  }

  private static async callAnamApi(
    customAvatarDataRequest: CreateCustomAvatarRequest,
    image_file?: Express.Multer.File,
  ): Promise<AnamAvatarResponse | ServiceError> {
    const url = `${config.customAvatar.anam.baseUrl}/avatars`;

    const formData = new FormData();
    formData.append('displayName', customAvatarDataRequest.display_name);

    if (image_file) {
      formData.append('imageFile', image_file.buffer, {
        filename: image_file.originalname,
        contentType: image_file.mimetype,
      });
    }

    const response = await AxiosUtils.makeCallToApi<AnamAvatarResponse>(
      url,
      'POST',
      { Authorization: `Bearer ${config.customAvatar.anam.apiKey}` },
      formData,
    );

    if ('code' in response) {
      logger.error('ANAM_API_ERROR', { error: response.message });
      return response;
    }

    logger.info('ANAM_API_SUCCESS', { avatar_id: response.id });
    return response;
  }

  static async getOrganizationAvatars(
    organization_id: string,
  ): Promise<OrganizationAvatarItem[] | ServiceError> {
    logger.info('GET_ORGANIZATION_AVATARS', { organization_id });

    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    const organizationAvatars = await OrganizationAvatarRepository.getMany(
      { organization_id: organization_id, is_active: true },
      ['avatar_id'],
    );

    const avatars =
      OrganizationAvatarConverter.toOrganizationAvatarItems(
        organizationAvatars,
      );

    logger.info('GET_ORGANIZATION_AVATARS_SUCCESS', {
      organization_id,
      count: avatars.length,
    });

    return avatars;
  }

  static async deleteAvatar(
    organization_id: string,
    avatar_id: string,
  ): Promise<DeleteAvatarResponse | ServiceError> {
    logger.info('DELETE_AVATAR', { organization_id, avatar_id });

    const validationResult = await this.validateDeleteAvatar(
      organization_id,
      avatar_id,
    );

    if ('code' in validationResult) {
      return validationResult;
    }

    // Delete from Anam provider
    const deleteResult = await this.deleteFromAnamApi(
      validationResult.external_id,
    );

    if ('code' in deleteResult) {
      return deleteResult;
    }

    // Use transaction to soft-delete in database
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Set is_active: false on Avatar
      await AvatarRepository.update(
        { _id: avatar_id },
        { is_active: false },
        session,
      );

      // Set is_active: false on OrganizationAvatar
      await OrganizationAvatarRepository.update(
        { organization_id: organization_id, avatar_id: avatar_id },
        { is_active: false },
        session,
      );

      await session.commitTransaction();
      session.endSession();

      logger.info('AVATAR_DELETED', { organization_id, avatar_id });

      return {
        avatar_id: avatar_id,
        deleted: true,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error('AVATAR_DELETE_FAILED', {
        organization_id,
        avatar_id,
        error,
      });
      return { code: 500, message: 'Failed to delete avatar' };
    }
  }

  private static async validateDeleteAvatar(
    organization_id: string,
    avatar_id: string,
  ): Promise<ValidateDeleteAvatarResult | ServiceError> {
    if (!avatar_id) {
      return { code: 400, message: 'Avatar ID is required' };
    }

    // Validate organization exists
    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    // Validate avatar exists and belongs to organization
    const organizationAvatar = await OrganizationAvatarRepository.get({
      organization_id: organization_id,
      avatar_id: avatar_id,
      is_active: true,
    });

    if (!organizationAvatar) {
      logger.warn('AVATAR_NOT_FOUND', { organization_id, avatar_id });
      return { code: 404, message: 'Avatar not found' };
    }

    // Get avatar details for external_id
    const avatar = await AvatarRepository.get({
      _id: avatar_id,
      is_active: true,
    });

    if (!avatar) {
      logger.warn('AVATAR_RECORD_NOT_FOUND', { avatar_id });
      return { code: 404, message: 'Avatar not found' };
    }

    return { external_id: avatar.external_id };
  }

  private static async deleteFromAnamApi(
    external_id: string,
  ): Promise<{ success: boolean } | ServiceError> {
    const url = `${config.customAvatar.anam.baseUrl}/avatars/${external_id}`;

    const response = await AxiosUtils.makeCallToApi<void>(url, 'DELETE', {
      Authorization: `Bearer ${config.customAvatar.anam.apiKey}`,
    });

    if (response && typeof response === 'object' && 'code' in response) {
      logger.error('ANAM_DELETE_API_ERROR', {
        error: (response as ServiceError).message,
      });
      return response as ServiceError;
    }

    logger.info('ANAM_DELETE_API_SUCCESS', { external_id });
    return { success: true };
  }
}

class OrganizationAvatarValidator {
  static async validateCreateAvatar(
    organization_id: string,
    data: CreateCustomAvatarRequest,
    image_file?: Express.Multer.File,
  ): Promise<ValidateCreateAvatarResult | ServiceError> {
    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    if (!image_file) {
      return { code: 400, message: 'Image file is required' };
    }

    if (!data.display_name) {
      return { code: 400, message: 'displayName is required' };
    }

    if (!config.customAvatar.anam.apiKey) {
      logger.error('ANAM_API_KEY_NOT_CONFIGURED');
      return { code: 500, message: 'Anam API key not configured' };
    }

    return { organization };
  }
}
