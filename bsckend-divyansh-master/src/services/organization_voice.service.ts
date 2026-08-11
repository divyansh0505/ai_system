import FormData from 'form-data';
import mongoose, { Types } from 'mongoose';

import { config } from '../../config';
import {
  VoiceRepository,
  OrganizationVoiceRepository,
  OrganizationRepository,
} from '../db/mongo/repository';
import { VOICE_PROVIDER } from '../db/mongo/models/types';
import type { Voice, Organization } from '../db/mongo/models/types';
import { AxiosUtils } from '../utils/axios';
import { S3Service } from '../utils/aws/s3';
import logger from '../utils/logger';
import type { ServiceError } from './types';

export interface CreateCustomVoiceRequest {
  name: string;
  description?: string;
  language?: string;
  baseVoiceId?: string;
}

export interface CreateCustomVoiceResponse {
  voice_id: string;
  name: string;
  external_id: string;
  provider: VOICE_PROVIDER;
  description?: string;
  playback_url?: string;
}

export interface UpdateVoiceRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateVoiceResponse {
  voice_id: string;
  name: string;
  description?: string;
  updated: boolean;
}

interface CartesiaVoiceResponse {
  id: string;
  user_id?: string;
  is_public?: boolean;
  name: string;
  description?: string;
  created_at?: string;
  language?: string;
}

interface ValidateCreateVoiceResult {
  organization: Organization;
}

export class OrganizationVoiceService {
  static async createCustomVoice(
    organization_id: string,
    customVoiceRequestData: CreateCustomVoiceRequest,
    audioClip?: Express.Multer.File,
  ): Promise<Voice | ServiceError> {
    logger.info('CREATE_CUSTOM_VOICE', {
      organization_id,
      name: customVoiceRequestData.name,
      hasAudioClip: !!audioClip,
    });

    const validationResult =
      await OrganizationVoiceValidator.validateCreateVoice(
        organization_id,
        customVoiceRequestData,
        audioClip,
      );

    if ('code' in validationResult) {
      return validationResult;
    }

    const cartesiaResponse = await this.callCartesiaApi(
      customVoiceRequestData,
      audioClip!,
    );

    if ('code' in cartesiaResponse) {
      return cartesiaResponse;
    }

    // Upload audio clip to S3 to store as playback URL
    let playbackUrl: string | undefined;
    const s3Url = await S3Service.uploadVoiceClip(
      audioClip!.buffer,
      cartesiaResponse.id,
      audioClip!.mimetype,
    );

    if (s3Url) {
      playbackUrl = s3Url;
      logger.info('VOICE_CLIP_UPLOADED_TO_S3', {
        voice_id: cartesiaResponse.id,
        url: s3Url,
      });
    } else {
      logger.warn('FAILED_TO_UPLOAD_VOICE_CLIP_TO_S3', {
        voice_id: cartesiaResponse.id,
      });
    }

    // Use transaction for atomic creation
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Create voice in database using configured default provider
      const voice = await VoiceRepository.create(
        {
          name: customVoiceRequestData.name,
          description: customVoiceRequestData.description,
          provider: config.customVoice.defaultProvider as VOICE_PROVIDER,
          external_id: cartesiaResponse.id,
          playback_url: playbackUrl,
          is_custom_generated: true,
          is_active: true,
        },
        session,
      );

      // Create organization-voice relationship
      await OrganizationVoiceRepository.create(
        {
          organization_id: organization_id,
          voice_id: (voice._id as Types.ObjectId).toString(),
          is_active: true,
        },
        session,
      );

      await session.commitTransaction();
      session.endSession();

      logger.info('CUSTOM_VOICE_CREATED', {
        organization_id,
        voice_id: (voice._id as Types.ObjectId).toString(),
        external_id: cartesiaResponse.id,
      });

      return voice;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error('VOICE_CREATE_FAILED', { organization_id, error });
      return { code: 500, message: 'Failed to create voice' };
    }
  }

  private static async callCartesiaApi(
    data: CreateCustomVoiceRequest,
    audioClip: Express.Multer.File,
  ): Promise<CartesiaVoiceResponse | ServiceError> {
    const url = `${config.customVoice.cartesia.baseUrl}/voices/clone`;

    const formData = new FormData();
    formData.append('clip', audioClip.buffer, {
      filename: audioClip.originalname,
      contentType: audioClip.mimetype,
    });
    formData.append('name', data.name);

    if (data.description) {
      formData.append('description', data.description);
    }

    formData.append('language', data.language || 'en');

    if (data.baseVoiceId) {
      formData.append('base_voice_id', data.baseVoiceId);
    }

    const response = await AxiosUtils.makeCallToApi<CartesiaVoiceResponse>(
      url,
      'POST',
      {
        Authorization: `Bearer ${config.customVoice.cartesia.apiKey}`,
        'Cartesia-Version': config.customVoice.cartesia.version,
      },
      formData,
    );

    if ('code' in response) {
      logger.error('CARTESIA_API_ERROR', { error: response.message });
      return response;
    }

    logger.info('CARTESIA_API_SUCCESS', { voice_id: response.id });
    return response;
  }

  static async getOrganizationVoices(
    organization_id: string,
  ): Promise<Voice[] | ServiceError> {
    logger.info('GET_ORGANIZATION_VOICES', { organization_id });

    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    const organizationVoices = await OrganizationVoiceRepository.getMany(
      { organization_id: organization_id, is_active: true },
      ['voice_id'],
    );

    const voices = organizationVoices
      .map((rel) => rel.voice_id as unknown as Voice)
      .filter((voice) => voice.is_active);

    logger.info('GET_ORGANIZATION_VOICES_SUCCESS', {
      organization_id,
      count: voices.length,
    });

    return voices;
  }

  static async updateVoice(
    organization_id: string,
    voice_id: string,
    updateData: UpdateVoiceRequest,
  ): Promise<UpdateVoiceResponse | ServiceError> {
    logger.info('UPDATE_VOICE', { organization_id, voice_id, updateData });

    const validationResult = await this.validateUpdateVoice(
      organization_id,
      voice_id,
      updateData,
    );

    if ('code' in validationResult) {
      return validationResult;
    }

    // Build update payload
    const voiceUpdatePayload: {
      name?: string;
      description?: string;
      is_active?: boolean;
    } = {};

    if (updateData.name) {
      voiceUpdatePayload.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      voiceUpdatePayload.description = updateData.description;
    }
    if (updateData.is_active !== undefined) {
      voiceUpdatePayload.is_active = updateData.is_active;
    }

    // Use transaction if soft-deleting (updating is_active)
    if (updateData.is_active !== undefined) {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        // Update voice
        await VoiceRepository.update(
          { _id: voice_id },
          voiceUpdatePayload,
          session,
        );

        // Update organization-voice relationship
        await OrganizationVoiceRepository.update(
          { organization_id: organization_id, voice_id: voice_id },
          { is_active: updateData.is_active },
          session,
        );

        await session.commitTransaction();
        session.endSession();

        logger.info('VOICE_UPDATED_WITH_IS_ACTIVE', {
          organization_id,
          voice_id,
          is_active: updateData.is_active,
        });

        return {
          voice_id: voice_id,
          name: updateData.name || '',
          description: updateData.description,
          updated: true,
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error('VOICE_UPDATE_FAILED', {
          organization_id,
          voice_id,
          error,
        });
        return { code: 500, message: 'Failed to update voice' };
      }
    }

    // Regular update without transaction
    const updatedVoice = await VoiceRepository.update(
      { _id: voice_id },
      voiceUpdatePayload,
    );

    if (!updatedVoice) {
      logger.error('VOICE_UPDATE_FAILED', { organization_id, voice_id });
      return { code: 500, message: 'Failed to update voice' };
    }

    logger.info('VOICE_UPDATED', { organization_id, voice_id });

    return {
      voice_id: voice_id,
      name: updatedVoice.name,
      description: updatedVoice.description,
      updated: true,
    };
  }

  private static async validateUpdateVoice(
    organization_id: string,
    voice_id: string,
    updateData: UpdateVoiceRequest,
  ): Promise<{ valid: true } | ServiceError> {
    if (!voice_id) {
      return { code: 400, message: 'Voice ID is required' };
    }

    if (
      !updateData.name &&
      updateData.description === undefined &&
      updateData.is_active === undefined
    ) {
      return { code: 400, message: 'At least one field to update is required' };
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

    // Validate voice exists and belongs to organization
    const organizationVoice = await OrganizationVoiceRepository.get({
      organization_id: organization_id,
      voice_id: voice_id,
      is_active: true,
    });

    if (!organizationVoice) {
      logger.warn('VOICE_NOT_FOUND', { organization_id, voice_id });
      return { code: 404, message: 'Voice not found' };
    }

    // Validate voice exists
    const voice = await VoiceRepository.get({
      _id: voice_id,
      is_active: true,
    });

    if (!voice) {
      logger.warn('VOICE_RECORD_NOT_FOUND', { voice_id });
      return { code: 404, message: 'Voice not found' };
    }

    return { valid: true };
  }
}

class OrganizationVoiceValidator {
  static async validateCreateVoice(
    organization_id: string,
    data: CreateCustomVoiceRequest,
    audioClip?: Express.Multer.File,
  ): Promise<ValidateCreateVoiceResult | ServiceError> {
    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    if (!audioClip) {
      return { code: 400, message: 'Audio clip file is required' };
    }

    if (!data.name) {
      return { code: 400, message: 'name is required' };
    }

    if (!config.customVoice.cartesia.apiKey) {
      logger.error('CARTESIA_API_KEY_NOT_CONFIGURED');
      return { code: 500, message: 'Cartesia API key not configured' };
    }

    return { organization };
  }
}
