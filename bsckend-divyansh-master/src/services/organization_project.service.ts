import mongoose, { Types } from 'mongoose';

import { config } from '../../config';
import {
  OrganizationRepository,
  OrganizationProjectRepository,
  OrganizationFlowsRepository,
  OrganizationSlidesRepository,
  AvatarRepository,
  VoiceRepository,
  OrganizationPagesRepository,
  OrganizationAvatarRepository,
  OrganizationVoiceRepository,
  OrganizationSharableLinkRepository,
  UserRepository,
  OrganizationConfigRepository,
} from '../db/mongo/repository';
import {
  ORGANIZATION_PROJECT_TYPE,
  type OrganizationProject,
} from '../db/mongo/models/types';
import { AuthService } from './auth.service';
import { OrganizationSlidesService } from './organization_slides.service';
import logger from '../utils/logger';
import type { CreateOrganizationSharableLinkDto, ServiceError } from './types';
import type { CreateOrganizationSlidesResponse } from './types/organization_slides.types';
import { ApolloService } from './apollo.service';
import { UserConverter } from './converters/user.converter';
import { OrganizationProjectConverter } from './converters/organization_project.converter';
import { SESService } from '../utils/aws/ses';
import { EmailTemplateGenerator } from '../generator/email_template.generator';
import type { ProjectAccessEmailData } from '../generator/email_template.generator';

const ENRICHMENT_TTL_MS = config.enrichment.ttlDays * 24 * 60 * 60 * 1000;

export interface CreateOrganizationProjectRequest {
  title?: string;
  pages?: string | mongoose.Types.ObjectId[];
  instructions?: string;
  description?: string;
  avatar_id?: string | mongoose.Types.ObjectId;
  voice_id?: string | mongoose.Types.ObjectId;
  project_context?: string;
  thumbnail?: string;
}

export interface CreateOrganizationFlowsResponse {
  success: boolean;
  organization_project_id: string;
  organization_flow_id: string;
}

export type CreateOrganizationProjectResponse =
  | CreateOrganizationFlowsResponse
  | CreateOrganizationSlidesResponse;

export interface ProjectMetadata {
  thumbnail?: string;
  is_active: boolean;
  is_draft?: boolean;
}

export interface OrganizationProjectItem {
  organization_project_id: string;
  title: string;
  description?: string;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  organization_flow_id?: string;
  organization_slides_id?: string;
  thumbnail?: string;
  is_active?: boolean;
  is_draft?: boolean;
  is_generation_running: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GetOrganizationProjectsResponse {
  projects: OrganizationProjectItem[];
  total: number;
}

export interface SlideItemResponse {
  narration?: string;
  image_url?: string;
}

export interface OrganizationSlidesResponse {
  organization_slides_id: string;
  version: number;
  knowledge_base?: string;
  thumbnail?: string;
  is_active: boolean;
  is_publicly_visible: boolean;
  slides: SlideItemResponse[];
}

export interface PageItem {
  page_id: string;
  display_name: string;
}

export interface OrganizationFlowsResponse {
  organization_flow_id: string;
  title: string;
  description?: string;
  instructions?: string;
  thumbnail?: string;
  is_active: boolean;
  is_publicly_visible: boolean;
  pages: PageItem[];
}

export interface ShareDetails {
  link: string;
  allowed_users: ShareLinkUser[];
}

export interface GetProjectResponse {
  organization_project_id: string;
  title: string;
  description?: string;
  avatar_id?: string;
  voice_id?: string;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  deployed_organization_project_type_id?: string;
  project_context?: string;
  is_publicly_visible: boolean;
  is_generation_running: boolean;
  organization_slides?: OrganizationSlidesResponse;
  organization_flows?: OrganizationFlowsResponse;
  share?: ShareDetails;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateOrganizationProjectRequest {
  title?: string;
  description?: string;
  avatar_id?: string;
  voice_id?: string;
  project_context?: string;
  thumbnail?: string;
  // For flows/slides
  is_active?: boolean;
  is_draft?: boolean;
  is_publicly_visible?: boolean;
  instructions?: string;
  pages?: string[];
}

export interface UpdateOrganizationProjectResponse {
  organization_project_id: string;
  organization_slides_id?: string;
  organization_flow_id?: string;
  slides_count?: number;
}

export interface ShareLinkUser {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  is_active: boolean;
  ttl?: string | null;
}

export interface GetProjectShareLinkResponse {
  link: string;
  organization_project_id: string;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  organization_flow_id?: string;
  organization_slides_id?: string;
  is_publicly_visible: boolean;
  allowed_users: ShareLinkUser[];
}

export interface ShareProjectRequest {
  email?: string | null;
  is_domain: boolean;
  ttl?: string | null;
}

export interface ShareProjectResponse {
  sharable_link_id: string;
  user_id: string;
  message: string;
}

export interface UpdateShareLinkItem {
  user_id: string;
  is_active?: boolean;
  ttl?: string | null;
}

export interface UpdateShareLinkRequest {
  updates: UpdateShareLinkItem[];
}

export interface UpdateShareLinkResultItem {
  user_id: string;
  sharable_link_id?: string;
  is_active?: boolean;
  ttl?: string;
  success: boolean;
  error?: string;
}

export interface UpdateShareLinkResponse {
  results: UpdateShareLinkResultItem[];
  total: number;
  successful: number;
  failed: number;
}

export interface CheckEmailRequiredResponse {
  is_email_needed: boolean;
  user_inputs: string[]; // e.g., ["email", "compliance_interested_in", "timeline"]
}

export class OrganizationProjectService {
  private static async verifyAndGetAvatarId(
    organizationId: string | Types.ObjectId,
    avatarId?: string,
  ): Promise<{ avatar_id: Types.ObjectId } | ServiceError> {
    // If provided, validate it exists and organization has access
    if (avatarId) {
      const avatar = await AvatarRepository.get({
        _id: avatarId,
        is_active: true,
      });

      if (!avatar) {
        logger.warn('AVATAR_NOT_FOUND', { avatar_id: avatarId });
        return { code: 404, message: `Avatar with ID ${avatarId} not found` };
      }

      // Check if organization has relationship with this avatar
      const hasRelationship = await OrganizationAvatarRepository.exists({
        organization_id: organizationId,
        avatar_id: avatarId,
        is_active: true,
      });

      if (!hasRelationship) {
        logger.warn('ORGANIZATION_AVATAR_RELATIONSHIP_NOT_FOUND', {
          organization_id: organizationId,
          avatar_id: avatarId,
        });
        return {
          code: 403,
          message: `Organization does not have access to avatar with ID ${avatarId}`,
        };
      }

      return { avatar_id: avatar._id as Types.ObjectId };
    }

    // Fall back to default
    const defaultAvatar = await AvatarRepository.get({
      external_id: config.defaults.avatar.external_id,
      provider: config.defaults.avatar.provider,
      is_active: true,
    });

    if (defaultAvatar) {
      logger.info('USING_DEFAULT_AVATAR', {
        avatar_id: (defaultAvatar._id as Types.ObjectId).toString(),
      });
      return { avatar_id: defaultAvatar._id as Types.ObjectId };
    }

    logger.error('DEFAULT_AVATAR_NOT_FOUND');
    return { code: 500, message: 'Default avatar not found' };
  }

  private static async verifyAndGetVoiceId(
    organizationId: string | Types.ObjectId,
    voiceId?: string,
  ): Promise<{ voice_id: Types.ObjectId } | ServiceError> {
    // If provided, validate it exists and organization has access
    if (voiceId) {
      const voice = await VoiceRepository.get({
        _id: voiceId,
        is_active: true,
      });

      if (!voice) {
        logger.warn('VOICE_NOT_FOUND', { voice_id: voiceId });
        return { code: 404, message: `Voice with ID ${voiceId} not found` };
      }

      // Check if organization has relationship with this voice
      const hasRelationship = await OrganizationVoiceRepository.exists({
        organization_id: organizationId,
        voice_id: voiceId,
        is_active: true,
      });

      if (!hasRelationship) {
        logger.warn('ORGANIZATION_VOICE_RELATIONSHIP_NOT_FOUND', {
          organization_id: organizationId,
          voice_id: voiceId,
        });
        return {
          code: 403,
          message: `Organization does not have access to voice with ID ${voiceId}`,
        };
      }

      return { voice_id: voice._id as Types.ObjectId };
    }

    // Fall back to default
    const defaultVoice = await VoiceRepository.get({
      external_id: config.defaults.voice.external_id,
      provider: config.defaults.voice.provider,
      is_active: true,
    });

    if (defaultVoice) {
      logger.info('USING_DEFAULT_VOICE', {
        voice_id: (defaultVoice._id as Types.ObjectId).toString(),
      });
      return { voice_id: defaultVoice._id as Types.ObjectId };
    }

    logger.error('DEFAULT_VOICE_NOT_FOUND');
    return { code: 500, message: 'Default voice not found' };
  }

  private static async verifyPagesExist(
    pageIds?: mongoose.Types.ObjectId[],
  ): Promise<{ valid: boolean; invalidIds: string[] }> {
    if (!pageIds || pageIds.length === 0) {
      return { valid: true, invalidIds: [] };
    }

    const pageIdStrings = pageIds.map((id) => id.toString());
    const existingCount =
      await OrganizationPagesRepository.countByIds(pageIdStrings);

    if (existingCount === pageIds.length) {
      return { valid: true, invalidIds: [] };
    }

    // Find which IDs are invalid
    const existingPages = await OrganizationPagesRepository.getMany({
      _id: { $in: pageIdStrings },
    });
    const existingIdSet = new Set(
      existingPages.map((p) => (p._id as Types.ObjectId).toString()),
    );
    const invalidIds = pageIdStrings.filter((id) => !existingIdSet.has(id));

    return { valid: false, invalidIds };
  }

  private static async getOrCreateDomainUser(
    domain: string,
  ): Promise<{ user_id: Types.ObjectId } | ServiceError> {
    // Block domain-based sharing for synthetic domains
    if (AuthService.isSyntheticDomain(domain)) {
      logger.warn('DOMAIN_SHARING_BLOCKED_FOR_SYNTHETIC_DOMAIN', { domain });
      return {
        code: 400,
        message:
          'Domain-based sharing is not supported for personal email domains.',
      };
    }

    const domainEmail = `*@${domain}`;
    const existingUser = await UserRepository.get({ email: domainEmail });

    if (existingUser) {
      logger.info('DOMAIN_USER_EXISTS', {
        user_id: existingUser._id,
        email: domainEmail,
      });
      return { user_id: existingUser._id as Types.ObjectId };
    }

    const newUser = await UserRepository.create({
      email: domainEmail,
      is_anonymous: false,
    });

    if (!newUser) {
      logger.error('FAILED_TO_CREATE_DOMAIN_USER', { email: domainEmail });
      return { code: 500, message: 'Failed to create domain user' };
    }

    logger.info('DOMAIN_USER_CREATED', {
      user_id: newUser._id,
      email: domainEmail,
    });
    return { user_id: newUser._id as Types.ObjectId };
  }

  private static async getOrCreateUserWithEnrichment(
    email: string | null | undefined,
  ): Promise<{ user_id: Types.ObjectId } | ServiceError> {
    if (!email) {
      logger.error('EMAIL_REQUIRED_FOR_NON_DOMAIN_SHARE');
      return {
        code: 400,
        message: 'Email is required when is_domain is false',
      };
    }

    const existingUser = await UserRepository.get({ email });

    if (existingUser) {
      const user_id = existingUser._id as Types.ObjectId;
      logger.info('USER_EXISTS_FOR_SHARE', { user_id, email });

      // Re-enrich if TTL expired
      const shouldEnrich =
        !existingUser.enrichment_ttl ||
        existingUser.enrichment_ttl <= new Date();

      if (shouldEnrich) {
        logger.info('RE_ENRICHING_USER', { user_id, email });
        await this.enrichUserData(user_id.toString(), email);
      }

      return { user_id };
    }

    const newUser = await UserRepository.create({
      email,
      is_anonymous: false,
    });

    if (!newUser) {
      logger.error('FAILED_TO_CREATE_USER', { email });
      return { code: 500, message: 'Failed to create user' };
    }

    const user_id = newUser._id as Types.ObjectId;
    logger.info('USER_CREATED_FOR_SHARE', { user_id, email });

    await this.enrichUserData(user_id.toString(), email);

    return { user_id };
  }

  private static async enrichUserData(
    user_id: string,
    email: string,
  ): Promise<void> {
    const enrichment_response = await ApolloService.enrichUserData(email);

    const ttl_date = new Date(Date.now() + ENRICHMENT_TTL_MS);

    if (enrichment_response.error || !enrichment_response.person) {
      logger.warn('USER_ENRICHMENT_FAILED_OR_NO_DATA', {
        user_id,
        email,
        error: enrichment_response.error,
      });

      // Still update TTL to avoid repeated failed attempts
      await UserRepository.update(
        { _id: user_id },
        { enrichment_ttl: ttl_date },
      );
      return;
    }

    const update_data = UserConverter.toUserUpdateData(
      enrichment_response.person,
      ttl_date,
    );

    await UserRepository.update({ _id: user_id }, update_data);

    logger.info('USER_ENRICHED_FOR_SHARE', {
      user_id,
      email,
      first_name: enrichment_response.person.first_name,
      last_name: enrichment_response.person.last_name,
    });
  }

  static async getProjects(
    organization_id: string,
  ): Promise<GetOrganizationProjectsResponse | ServiceError> {
    logger.info('GET_ORGANIZATION_PROJECTS', { organization_id });

    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    const projects = await OrganizationProjectRepository.getMany({
      organization_id,
    });

    if (!projects || projects.length === 0) {
      return { projects: [], total: 0 };
    }

    const slideIds = projects
      .filter(
        (p) => p.organization_project_type === ORGANIZATION_PROJECT_TYPE.SLIDES,
      )
      .map((p) => p.deployed_organization_project_type_id)
      .filter(Boolean);

    const flowIds = projects
      .filter(
        (p) => p.organization_project_type === ORGANIZATION_PROJECT_TYPE.FLOWS,
      )
      .map((p) => p.deployed_organization_project_type_id)
      .filter(Boolean);

    const [slides, flows] = await Promise.all([
      slideIds.length > 0
        ? OrganizationSlidesRepository.getMany({
            _id: { $in: slideIds },
            $or: [{ is_active: true }, { is_draft: true }],
          })
        : [],
      flowIds.length > 0
        ? OrganizationFlowsRepository.getMany({
            _id: { $in: flowIds },
            $or: [{ is_active: true }, { is_draft: true }],
          })
        : [],
    ]);

    const metadataMap = new Map(
      [...slides, ...flows].map((item) => [
        item._id.toString(),
        {
          thumbnail: item.thumbnail,
          is_active: item.is_active,
          is_draft: 'is_draft' in item ? item.is_draft : undefined,
        },
      ]),
    );

    const filteredProjects = projects.filter((p) =>
      metadataMap.has(p.deployed_organization_project_type_id?.toString()),
    );

    const projectItems = OrganizationProjectConverter.toProjectItems(
      filteredProjects,
      metadataMap,
    );

    logger.info('GET_ORGANIZATION_PROJECTS_SUCCESS', {
      organization_id,
      total: projectItems.length,
    });

    return { projects: projectItems, total: projectItems.length };
  }

  static async getProject(
    organization_id: string,
    organization_project_id: string,
  ): Promise<GetProjectResponse | ServiceError> {
    logger.info('GET_PROJECT', { organization_id, organization_project_id });

    const project = await OrganizationProjectRepository.get({
      _id: organization_project_id,
      organization_id: organization_id,
    });

    if (!project) {
      logger.warn('PROJECT_NOT_FOUND', {
        organization_id,
        organization_project_id,
      });
      return { code: 404, message: 'Project not found' };
    }

    let slides = null;
    let flows = null;

    if (
      project.organization_project_type === ORGANIZATION_PROJECT_TYPE.SLIDES &&
      project.deployed_organization_project_type_id
    ) {
      slides = await OrganizationSlidesRepository.get({
        _id: project.deployed_organization_project_type_id,
        organization_id: organization_id,
        $or: [{ is_active: true }, { is_draft: true }],
      });
    }

    let pages: PageItem[] = [];

    if (
      project.organization_project_type === ORGANIZATION_PROJECT_TYPE.FLOWS &&
      project.deployed_organization_project_type_id
    ) {
      flows = await OrganizationFlowsRepository.get({
        _id: project.deployed_organization_project_type_id,
        organization_id: organization_id,
        is_active: true,
      });

      // Fetch pages for the flow
      if (flows && flows.pages && flows.pages.length > 0) {
        const pageIds = flows.pages.map((p) => p.toString());
        const pagesData = await OrganizationPagesRepository.getMany({
          _id: { $in: pageIds },
        });

        // Create a map for quick lookup and preserve order
        const pagesMap = new Map(
          pagesData.map((page) => [
            (page._id as Types.ObjectId).toString(),
            page,
          ]),
        );

        pages = pageIds
          .map((pageId) => {
            const page = pagesMap.get(pageId);
            if (page) {
              return {
                page_id: pageId,
                display_name: page.display_name,
              };
            }
            return null;
          })
          .filter((p): p is PageItem => p !== null);
      }
    }

    // Get share details
    const project_id = (project._id as Types.ObjectId).toString();
    const link = this.buildProjectShareLink(
      project_id,
      organization_id,
      project.organization_project_type,
    );

    const sharableLinks = await OrganizationSharableLinkRepository.getMany({
      organization_project_id: project_id,
      is_active: true,
    });

    let allowedUsers: ShareLinkUser[] = [];

    if (sharableLinks.length > 0) {
      const userIds = sharableLinks.map((link) => link.user_id.toString());
      const users = await UserRepository.getMany({
        _id: { $in: userIds },
      });

      const sharableLinkMap = new Map(
        sharableLinks.map((link) => [link.user_id.toString(), link]),
      );

      allowedUsers = users.map((user) => {
        const userId = user._id.toString();
        const sharableLink = sharableLinkMap.get(userId);
        return {
          user_id: userId,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          company_name: user.company_name,
          is_active: sharableLink?.is_active ?? false,
          ttl: sharableLink?.ttl ?? null,
        };
      });
    }

    const shareDetails: ShareDetails = {
      link,
      allowed_users: allowedUsers,
    };

    logger.info('GET_PROJECT_SUCCESS', {
      organization_id,
      organization_project_id,
      allowed_users_count: allowedUsers.length,
    });

    return OrganizationProjectConverter.toGetProjectResponse(
      project,
      slides,
      flows,
      shareDetails,
      pages,
    );
  }

  static async updateProject(
    organization_id: string,
    organization_project_id: string,
    projectType: ORGANIZATION_PROJECT_TYPE,
    projectData: UpdateOrganizationProjectRequest,
  ): Promise<UpdateOrganizationProjectResponse | ServiceError> {
    logger.info('UPDATING_PROJECT', {
      organization_id,
      organization_project_id,
      projectType,
    });

    const project = await OrganizationProjectRepository.get({
      _id: organization_project_id,
      organization_id: organization_id,
    });

    if (!project) {
      logger.warn('PROJECT_NOT_FOUND', {
        organization_id,
        organization_project_id,
      });
      return { code: 404, message: 'Project not found' };
    }

    if (project.organization_project_type !== projectType) {
      logger.warn('PROJECT_TYPE_MISMATCH', {
        expected: project.organization_project_type,
        received: projectType,
      });
      return { code: 400, message: 'Project type mismatch' };
    }

    switch (projectType) {
      case ORGANIZATION_PROJECT_TYPE.SLIDES:
        return OrganizationSlidesService.updateSlides(
          organization_id,
          organization_project_id,
          projectData,
        );

      case ORGANIZATION_PROJECT_TYPE.FLOWS:
        return this.updateFlowsProject(
          organization_id,
          organization_project_id,
          projectData,
        );

      default:
        return {
          code: 400,
          message: 'Update not supported for this project type',
        };
    }
  }

  private static async updateFlowsProject(
    organization_id: string,
    organization_project_id: string,
    projectData: UpdateOrganizationProjectRequest,
  ): Promise<UpdateOrganizationProjectResponse | ServiceError> {
    logger.info('UPDATE_FLOWS_PROJECT', {
      organization_id,
      organization_project_id,
    });

    const project = await OrganizationProjectRepository.get({
      _id: organization_project_id,
      organization_id: organization_id,
    });

    if (!project) {
      logger.warn('PROJECT_NOT_FOUND', { organization_project_id });
      return { code: 404, message: 'Project not found' };
    }

    const flowId = project.deployed_organization_project_type_id?.toString();
    if (!flowId) {
      logger.warn('FLOW_NOT_FOUND_FOR_PROJECT', { organization_project_id });
      return { code: 404, message: 'Flow not found for this project' };
    }

    const flow = await OrganizationFlowsRepository.get({
      _id: flowId,
      organization_id: organization_id,
    });

    if (!flow) {
      logger.warn('FLOW_NOT_FOUND', { flowId });
      return { code: 404, message: 'Flow not found' };
    }

    // Validate avatar if provided
    if (projectData.avatar_id) {
      const avatarResult = await this.verifyAndGetAvatarId(
        organization_id,
        projectData.avatar_id,
      );
      if ('code' in avatarResult) {
        return avatarResult;
      }
    }

    // Validate voice if provided
    if (projectData.voice_id) {
      const voiceResult = await this.verifyAndGetVoiceId(
        organization_id,
        projectData.voice_id,
      );
      if ('code' in voiceResult) {
        return voiceResult;
      }
    }

    // Validate pages if provided
    if (projectData.pages && projectData.pages.length > 0) {
      const pageIds = projectData.pages.map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      const pagesValidation = await this.verifyPagesExist(pageIds);
      if (!pagesValidation.valid) {
        return {
          code: 400,
          message: `Invalid page IDs: ${pagesValidation.invalidIds.join(', ')}`,
        };
      }
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Update project metadata
      const projectUpdate: Record<string, unknown> = {};
      if (projectData.title) projectUpdate.title = projectData.title;
      if (projectData.description)
        projectUpdate.description = projectData.description;
      if (projectData.avatar_id)
        projectUpdate.avatar_id = new Types.ObjectId(projectData.avatar_id);
      if (projectData.voice_id)
        projectUpdate.voice_id = new Types.ObjectId(projectData.voice_id);
      if (projectData.project_context)
        projectUpdate.project_context = projectData.project_context;

      if (Object.keys(projectUpdate).length > 0) {
        await OrganizationProjectRepository.update(
          { _id: organization_project_id },
          projectUpdate,
          session,
        );
      }

      // Update flow
      const flowUpdate: Record<string, unknown> = {};
      if (projectData.title) flowUpdate.title = projectData.title;
      if (projectData.description)
        flowUpdate.description = projectData.description;
      if (projectData.instructions)
        flowUpdate.instructions = projectData.instructions;
      if (projectData.thumbnail) flowUpdate.thumbnail = projectData.thumbnail;
      if (projectData.is_active !== undefined)
        flowUpdate.is_active = projectData.is_active;
      if (projectData.is_publicly_visible !== undefined)
        flowUpdate.is_publicly_visible = projectData.is_publicly_visible;
      if (projectData.pages)
        flowUpdate.pages = projectData.pages.map(
          (id) => new mongoose.Types.ObjectId(id),
        );

      if (Object.keys(flowUpdate).length > 0) {
        await OrganizationFlowsRepository.update(
          { _id: flowId },
          flowUpdate,
          session,
        );
      }

      await session.commitTransaction();

      logger.info('FLOWS_PROJECT_UPDATED', {
        organization_id,
        organization_project_id,
        flow_id: flowId,
      });

      return {
        organization_project_id,
        organization_flow_id: flowId,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('UPDATE_FLOWS_PROJECT_FAILED', {
        organization_project_id,
        error: (error as Error).message,
      });
      return { code: 500, message: 'Failed to update flows project' };
    } finally {
      session.endSession();
    }
  }

  static async createProject(
    organization_id: string | Types.ObjectId,
    projectType: ORGANIZATION_PROJECT_TYPE,
    projectData: CreateOrganizationProjectRequest,
    powerpointFile?: Express.Multer.File,
    knowledgeBaseFile?: Express.Multer.File,
  ): Promise<CreateOrganizationProjectResponse | ServiceError> {
    const validationError = OrganizationProjectValidator.validate(
      projectType,
      projectData,
      powerpointFile,
    );

    if (validationError) {
      logger.warn('CREATE_PROJECT_VALIDATION_FAILED', {
        organization_id,
        error: validationError.message,
      });
      return validationError;
    }

    logger.info('CREATING_PROJECT', {
      organization_id,
      projectType,
      title: projectData.title,
    });

    switch (projectType) {
      case ORGANIZATION_PROJECT_TYPE.FLOWS:
        return this.createFlowsProject(organization_id, projectData);

      case ORGANIZATION_PROJECT_TYPE.SLIDES:
        return OrganizationSlidesService.createFromPptx(
          organization_id as string,
          powerpointFile as Express.Multer.File,
          {
            title: projectData.title,
            avatar_id: projectData.avatar_id as string,
            voice_id: projectData.voice_id as string,
            project_context: projectData.project_context,
            thumbnail: projectData.thumbnail,
          },
          knowledgeBaseFile,
        );

      default:
        return { code: 400, message: 'Invalid project type' };
    }
  }

  static async getShareLink(
    organization_id: string,
    organization_project_type_id: string,
  ): Promise<GetProjectShareLinkResponse | ServiceError> {
    logger.info('GET_PROJECT_SHARE_LINK', {
      organization_id,
      organization_project_type_id,
    });

    // First try to find slides or flows by the given ID
    const slides = await OrganizationSlidesRepository.get({
      _id: organization_project_type_id,
      organization_id: organization_id,
    });

    const flows = !slides
      ? await OrganizationFlowsRepository.get({
          _id: organization_project_type_id,
          organization_id: organization_id,
        })
      : null;

    const projectTypeEntity = slides || flows;

    if (!projectTypeEntity) {
      logger.warn('SLIDES_OR_FLOWS_NOT_FOUND', {
        organization_id,
        organization_project_type_id,
      });
      return { code: 404, message: 'Slides or Flows not found' };
    }

    // Get the organization project using the organization_project_id from slides/flows
    const organizationProject = await OrganizationProjectRepository.get({
      _id: projectTypeEntity.organization_project_id,
      organization_id: organization_id,
    });

    if (!organizationProject) {
      logger.warn('PROJECT_NOT_FOUND', {
        organization_id,
        organization_project_type_id,
      });
      return { code: 404, message: 'Project not found' };
    }

    const project_id = (
      organizationProject._id as mongoose.Types.ObjectId
    ).toString();
    const link = this.buildProjectShareLink(
      project_id,
      organization_id,
      organizationProject.organization_project_type,
    );

    const sharableLinks = await OrganizationSharableLinkRepository.getMany({
      organization_project_id: project_id,
      is_active: true,
    });

    let allowedUsers: ShareLinkUser[] = [];

    if (sharableLinks.length > 0) {
      const userIds = sharableLinks.map((link) => link.user_id.toString());
      const users = await UserRepository.getMany({
        _id: { $in: userIds },
      });

      // Create a map of user_id to sharable link for quick lookup
      const sharableLinkMap = new Map(
        sharableLinks.map((link) => [link.user_id.toString(), link]),
      );

      allowedUsers = users.map((user) => {
        const userId = user._id.toString();
        const sharableLink = sharableLinkMap.get(userId);
        return {
          user_id: userId,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          company_name: user.company_name,
          is_active: sharableLink?.is_active ?? false,
          ttl: sharableLink?.ttl ?? null,
        };
      });
    }

    logger.info('GET_PROJECT_SHARE_LINK_SUCCESS', {
      organization_id,
      organization_project_type_id,
      allowed_users_count: allowedUsers.length,
    });

    return {
      link,
      organization_project_id: project_id,
      organization_project_type: organizationProject.organization_project_type,
      organization_flow_id:
        organizationProject.organization_project_type ===
        ORGANIZATION_PROJECT_TYPE.FLOWS
          ? organization_project_type_id
          : undefined,
      organization_slides_id:
        organizationProject.organization_project_type ===
        ORGANIZATION_PROJECT_TYPE.SLIDES
          ? organization_project_type_id
          : undefined,
      is_publicly_visible: projectTypeEntity.is_publicly_visible,
      allowed_users: allowedUsers,
    };
  }

  static buildProjectShareLink(
    project_id: string,
    organization_id: string,
    project_type: ORGANIZATION_PROJECT_TYPE,
  ): string {
    return `${config.interact.baseUrl}?organization_id=${organization_id}&project_id=${project_id}&type=${project_type}`;
  }

  private static async createFlowsProject(
    organization_id: string | Types.ObjectId,
    projectData: CreateOrganizationProjectRequest,
  ): Promise<CreateOrganizationFlowsResponse | ServiceError> {
    // Verify organization exists
    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });

    if (!organization) {
      logger.error('ORGANIZATION_NOT_FOUND', { organization_id });
      return {
        code: 404,
        message: `Organization with ID ${organization_id} not found`,
      };
    }

    // Resolve avatar, voice IDs and verify pages in parallel
    const [avatarResult, voiceResult, pagesValidation] = await Promise.all([
      OrganizationProjectService.verifyAndGetAvatarId(
        organization_id,
        projectData.avatar_id as string,
      ),
      OrganizationProjectService.verifyAndGetVoiceId(
        organization_id,
        projectData.voice_id as string,
      ),
      OrganizationProjectService.verifyPagesExist(
        projectData.pages as mongoose.Types.ObjectId[],
      ),
    ]);

    // Check if avatar or voice validation failed
    if ('code' in avatarResult || 'code' in voiceResult) {
      const failedResult = 'code' in avatarResult ? avatarResult : voiceResult;
      const name = 'code' in avatarResult ? 'AVATAR' : 'VOICE';
      logger.error(`${name}_VALIDATION_FAILED`, {
        organization_id,
        error: (failedResult as ServiceError).message,
      });
      return failedResult as ServiceError;
    }

    const avatar_id = avatarResult.avatar_id;
    const voice_id = voiceResult.voice_id;

    // Check if all provided page IDs exist
    if (!pagesValidation.valid) {
      logger.error('INVALID_PAGE_IDS', {
        organization_id,
        invalid_page_ids: pagesValidation.invalidIds,
      });
      return {
        code: 400,
        message: `Invalid page IDs: ${pagesValidation.invalidIds.join(', ')}`,
      };
    }

    // Use a transaction for atomic creation of flow and project
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // First create the OrganizationProject entry
      const organizationProject = await OrganizationProjectRepository.create(
        {
          title: projectData.title,
          description: projectData.description,
          avatar_id: avatar_id,
          voice_id: voice_id,
          organization_id: organization._id as Types.ObjectId,
          organization_project_type: ORGANIZATION_PROJECT_TYPE.FLOWS,
        },
        session,
      );

      const project_id = organizationProject._id as Types.ObjectId;

      // Create the OrganizationFlows entry with the project ID
      const organizationFlow = await OrganizationFlowsRepository.create(
        {
          organization_project_id: project_id,
          organization_id: organization._id as Types.ObjectId,
          title: projectData.title,
          description: projectData.description,
          instructions: projectData.instructions,
          thumbnail: projectData.thumbnail,
          pages: projectData.pages as mongoose.Types.ObjectId[],
          topics: [],
          is_active: true,
        },
        session,
      );

      const flow_id = organizationFlow._id as Types.ObjectId;

      // Update the project with the flow ID
      await OrganizationProjectRepository.update(
        { _id: project_id },
        {
          deployed_organization_project_type_id: flow_id,
          organization_project_type: ORGANIZATION_PROJECT_TYPE.FLOWS,
        },
        session,
      );

      await session.commitTransaction();
      session.endSession();

      logger.info('FLOWS_PROJECT_CREATED', {
        organization_project_id: project_id.toString(),
        organization_flow_id: flow_id.toString(),
      });

      return {
        success: true,
        organization_project_id: project_id.toString(),
        organization_flow_id: flow_id.toString(),
      };
    } catch (error) {
      logger.error('FLOWS_PROJECT_CREATION_FAILED', { organization_id, error });
      await session.abortTransaction();
      session.endSession();
      return { code: 500, message: 'Failed to create flows project' };
    }
  }

  static async shareProject(
    organization_id: string | Types.ObjectId,
    organization_project_type_id: string,
    shareData: ShareProjectRequest,
  ): Promise<ShareProjectResponse | ServiceError> {
    logger.info('SHARING_PROJECT', {
      organization_id,
      organization_project_type_id,
      is_domain: shareData.is_domain,
      has_email: !!shareData.email,
    });

    const organization = await OrganizationRepository.get({
      _id: organization_id,
      is_active: true,
    });

    if (!organization) {
      logger.error('ORGANIZATION_NOT_FOUND', { organization_id });
      return {
        code: 404,
        message: `Organization with ID ${organization_id} not found`,
      };
    }

    // First try to find slides or flows by the given ID
    const slides = await OrganizationSlidesRepository.get({
      _id: organization_project_type_id,
      organization_id: organization._id,
    });

    const flows = !slides
      ? await OrganizationFlowsRepository.get({
          _id: organization_project_type_id,
          organization_id: organization._id,
        })
      : null;

    const projectTypeEntity = slides || flows;

    if (!projectTypeEntity) {
      logger.error('SLIDES_OR_FLOWS_NOT_FOUND', {
        organization_project_type_id,
        organization_id,
      });
      return {
        code: 404,
        message: `Slides or Flows with ID ${organization_project_type_id} not found`,
      };
    }

    // Get the organization project using the organization_project_id from slides/flows
    const project = await OrganizationProjectRepository.get({
      _id: projectTypeEntity.organization_project_id,
      organization_id: organization._id,
    });

    if (!project) {
      logger.error('PROJECT_NOT_FOUND', {
        project_id: projectTypeEntity.organization_project_id,
        organization_id,
      });
      return {
        code: 404,
        message: `Project not found for the given slides/flows`,
      };
    }

    // Get or create user based on sharing type
    const userResult = shareData.is_domain
      ? await this.getOrCreateDomainUser(shareData.email as string)
      : await this.getOrCreateUserWithEnrichment(shareData.email);

    if ('code' in userResult) {
      return userResult;
    }

    const { user_id } = userResult;

    // Check if sharable link already exists
    const existingLink = await OrganizationSharableLinkRepository.get({
      user_id,
      organization_project_id: project._id,
      is_active: true,
    });

    if (existingLink) {
      logger.info('SHARABLE_LINK_EXISTS', {
        sharable_link_id: existingLink._id,
        user_id,
        organization_project_type_id,
      });
      return {
        sharable_link_id: (existingLink._id as Types.ObjectId).toString(),
        user_id: user_id.toString(),
        message: 'Sharable link already exists',
      };
    }

    // Default TTL is 3 days from now if not provided
    const DEFAULT_TTL_DAYS = 3;
    const defaultTtl = new Date(
      Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const ttl = shareData.ttl ?? defaultTtl;
    const accessDuration = this.calculateAccessDuration(ttl);

    // Send email notification for individual users
    if (!shareData.is_domain) {
      const project_link = this.buildProjectShareLink(
        (project._id as Types.ObjectId).toString(),
        organization_id.toString(),
        project.organization_project_type,
      );

      const projectAccessEmailData = {
        to: shareData.email as string,
        project_title: project.title,
        organization_name: organization.name,
        access_duration: accessDuration,
        project_link,
      } as ProjectAccessEmailData;

      const emailResult = await this.sendProjectAccessEmail(
        projectAccessEmailData,
      );

      if ('code' in emailResult) {
        logger.error('PROJECT_SHARE_EMAIL_FAILED', {
          email: shareData.email,
          organization_project_type_id,
        });
        return emailResult;
      }
    } else {
      // TODO: Implement email notification for domain-based users
      logger.warn('SKIPPING_EMAIL_FOR_DOMAIN_SHARE', {
        domain: shareData.email,
        organization_id,
      });
    }

    // Create new sharable link
    const sharableLinkData = {
      organization_project_type: project.organization_project_type,
      user_id,
      organization_project_type_id:
        project.deployed_organization_project_type_id,
      organization_project_id: project._id as Types.ObjectId,
      is_domain: shareData.is_domain,
      is_active: true,
      ttl,
    } as CreateOrganizationSharableLinkDto;

    const sharableLink =
      await OrganizationSharableLinkRepository.create(sharableLinkData);

    logger.info('SHARABLE_LINK_CREATED', {
      sharable_link_id: sharableLink._id,
      user_id,
      organization_project_type_id,
      is_domain: shareData.is_domain,
    });

    return {
      sharable_link_id: (sharableLink._id as Types.ObjectId).toString(),
      user_id: user_id.toString(),
      message: 'Project shared successfully',
    };
  }

  static async updateShareLink(
    organization_id: string,
    organization_project_type_id: string,
    updateData: UpdateShareLinkRequest,
  ): Promise<UpdateShareLinkResponse | ServiceError> {
    logger.info('UPDATING_SHARE_LINKS', {
      organization_id,
      organization_project_type_id,
      updates_count: updateData.updates?.length,
    });

    const validationResult =
      OrganizationProjectValidator.validateUpdateShareLink(updateData);

    if ('code' in validationResult) {
      return validationResult;
    }

    // First try to find slides or flows by the given ID
    const slides = await OrganizationSlidesRepository.get({
      _id: organization_project_type_id,
      organization_id: organization_id,
    });

    const flows = !slides
      ? await OrganizationFlowsRepository.get({
          _id: organization_project_type_id,
          organization_id: organization_id,
        })
      : null;

    const projectTypeEntity = slides || flows;

    if (!projectTypeEntity) {
      logger.warn('SLIDES_OR_FLOWS_NOT_FOUND', {
        organization_id,
        organization_project_type_id,
      });
      return { code: 404, message: 'Slides or Flows not found' };
    }

    // Get the organization project using the organization_project_id from slides/flows
    const organizationProject = await OrganizationProjectRepository.get({
      _id: projectTypeEntity.organization_project_id,
      organization_id: organization_id,
    });

    if (!organizationProject) {
      logger.warn('PROJECT_NOT_FOUND', {
        organization_id,
        organization_project_type_id,
      });
      return { code: 404, message: 'Project not found' };
    }

    const projectId = (
      organizationProject._id as mongoose.Types.ObjectId
    ).toString();
    const results: UpdateShareLinkResultItem[] = [];

    for (const update of validationResult) {
      const sharableLink = await OrganizationSharableLinkRepository.get({
        organization_project_id: projectId,
        user_id: update.user_id,
      });

      if (!sharableLink) {
        logger.warn('SHARE_LINK_NOT_FOUND_FOR_USER', {
          organization_id,
          organization_project_type_id,
          user_id: update.user_id,
        });
        results.push({
          user_id: update.user_id,
          success: false,
          error: 'Share link not found for this user',
        });
        continue;
      }

      const updateFields: { is_active?: boolean; ttl?: string | null } = {};
      if (update.is_active !== undefined) {
        updateFields.is_active = update.is_active;
      }
      if (update.ttl !== undefined) {
        updateFields.ttl = update.ttl;
      }

      const updatedSharableLink =
        await OrganizationSharableLinkRepository.update(
          { _id: sharableLink._id },
          updateFields,
        );

      if (!updatedSharableLink) {
        logger.error('SHARE_LINK_UPDATE_FAILED', {
          organization_id,
          organization_project_type_id,
          user_id: update.user_id,
          sharable_link_id: sharableLink._id,
        });
        results.push({
          user_id: update.user_id,
          success: false,
          error: 'Failed to update share link',
        });
        continue;
      }

      logger.info('SHARE_LINK_UPDATED', {
        organization_id,
        organization_project_type_id,
        user_id: update.user_id,
        sharable_link_id: updatedSharableLink._id,
        is_active: updatedSharableLink.is_active,
        ttl: updatedSharableLink.ttl,
      });

      results.push({
        user_id: update.user_id,
        sharable_link_id: (
          updatedSharableLink._id as Types.ObjectId
        ).toString(),
        is_active: updatedSharableLink.is_active,
        ttl: updatedSharableLink.ttl,
        success: true,
      });
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      results,
      total: results.length,
      successful,
      failed,
    };
  }

  private static calculateAccessDuration(ttl: string): string {
    const ttlDate = new Date(ttl);
    const now = new Date();
    const diffMs = ttlDate.getTime() - now.getTime();
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  }

  private static async getValidatedProject(
    project_id: string,
    project_type: ORGANIZATION_PROJECT_TYPE,
  ): Promise<{ project: OrganizationProject } | ServiceError> {
    const project = await OrganizationProjectRepository.get({
      _id: project_id,
    });

    if (!project) {
      logger.warn('PROJECT_NOT_FOUND', { project_id });
      return { code: 404, message: 'Project not found' };
    }

    if (project.organization_project_type !== project_type) {
      logger.warn('PROJECT_TYPE_MISMATCH', {
        expected: project.organization_project_type,
        received: project_type,
      });
      return { code: 400, message: 'Project type mismatch' };
    }

    if (!project.deployed_organization_project_type_id) {
      logger.warn('PROJECT_NOT_DEPLOYED', { project_id });
      return { code: 404, message: 'Project not deployed' };
    }

    return { project };
  }

  static async checkEmailRequired(
    project_id: string,
    project_type: string,
  ): Promise<CheckEmailRequiredResponse | ServiceError> {
    logger.info('CHECK_EMAIL_REQUIRED', { project_id, project_type });

    const validationResult =
      OrganizationProjectValidator.validateCheckEmailRequired(
        project_id,
        project_type,
      );

    if ('code' in validationResult) {
      return validationResult;
    }

    const validatedProject = await this.getValidatedProject(
      validationResult.project_id,
      validationResult.project_type,
    );

    if ('code' in validatedProject) {
      return validatedProject;
    }

    let deployedProject;
    if (validationResult.project_type === ORGANIZATION_PROJECT_TYPE.SLIDES) {
      deployedProject = await OrganizationSlidesRepository.get({
        _id: validatedProject.project.deployed_organization_project_type_id,
      });
    }
    if (validationResult.project_type === ORGANIZATION_PROJECT_TYPE.FLOWS) {
      deployedProject = await OrganizationFlowsRepository.get({
        _id: validatedProject.project.deployed_organization_project_type_id,
      });
    }

    if (!deployedProject) {
      logger.warn('DEPLOYED_PROJECT_NOT_FOUND', {
        deployed_id:
          validatedProject.project.deployed_organization_project_type_id,
        project_type: validationResult.project_type,
      });
      return {
        code: 404,
        message: `${validationResult.project_type} not found`,
      };
    }

    // Fetch organization to get org config
    const organization = await OrganizationRepository.get({
      _id: validatedProject.project.organization_id,
    });

    let user_inputs: string[] = [];
    if (organization?.organization_config_id) {
      const orgConfig = await OrganizationConfigRepository.get({
        _id: organization.organization_config_id,
      });
      user_inputs = orgConfig?.user_inputs || [];
    }

    logger.info('CHECK_EMAIL_REQUIRED_SUCCESS', {
      project_id,
      project_type: validationResult.project_type,
      is_email_needed: !deployedProject.is_publicly_visible,
      user_inputs,
    });
    return {
      is_email_needed: !deployedProject.is_publicly_visible,
      user_inputs,
    };
  }

  private static async sendProjectAccessEmail(
    projectAccessEmailData: ProjectAccessEmailData,
  ): Promise<{ success: true } | ServiceError> {
    const emailTemplate = EmailTemplateGenerator.generateProjectAccessTemplate(
      projectAccessEmailData,
    );

    const sesService = new SESService();
    const emailResult = await sesService.sendEmail(emailTemplate);

    if ('code' in emailResult) {
      logger.error('PROJECT_SHARE_EMAIL_FAILED', {
        email: projectAccessEmailData.to,
        error: emailResult.message,
      });
      return {
        code: 500,
        message: 'Failed to send access notification email',
      };
    }

    logger.info('PROJECT_SHARE_EMAIL_SENT', {
      email: projectAccessEmailData.to,
      message_id: emailResult.MessageId,
    });

    return { success: true };
  }
}

class OrganizationProjectValidator {
  static validate(
    projectType: ORGANIZATION_PROJECT_TYPE,
    data: CreateOrganizationProjectRequest,
    file?: Express.Multer.File,
  ): ServiceError | null {
    if (
      !projectType ||
      !Object.values(ORGANIZATION_PROJECT_TYPE).includes(projectType)
    ) {
      return {
        code: 400,
        message: `Invalid project type. Must be one of: ${Object.values(
          ORGANIZATION_PROJECT_TYPE,
        ).join(', ')}`,
      };
    }

    if (projectType === ORGANIZATION_PROJECT_TYPE.SLIDES && !file) {
      return {
        code: 400,
        message: 'File is required for creating a slides project',
      };
    }

    return null;
  }

  static validateShareProject(
    data: ShareProjectRequest,
  ): ShareProjectRequest | ServiceError {
    if (typeof data.is_domain !== 'boolean') {
      return {
        code: 400,
        message: 'is_domain is required and must be a boolean',
      };
    }

    if (!data.is_domain && !data.email) {
      return {
        code: 400,
        message: 'Email is required when is_domain is false',
      };
    }

    if (data.email && typeof data.email !== 'string') {
      return {
        code: 400,
        message: 'Email must be a string',
      };
    }

    // Basic email validation when email is provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return {
          code: 400,
          message: 'Invalid email format',
        };
      }
    }

    return {
      email: data.email || null,
      is_domain: data.is_domain,
    };
  }

  static validateUpdateShareLink(
    data: UpdateShareLinkRequest,
  ): UpdateShareLinkItem[] | ServiceError {
    if (!data.updates || !Array.isArray(data.updates)) {
      return {
        code: 400,
        message: 'updates array is required',
      };
    }

    if (data.updates.length === 0) {
      return {
        code: 400,
        message: 'updates array cannot be empty',
      };
    }

    const validatedUpdates: UpdateShareLinkItem[] = [];

    for (let i = 0; i < data.updates.length; i++) {
      const update = data.updates[i];

      if (!update.user_id || typeof update.user_id !== 'string') {
        return {
          code: 400,
          message: `updates[${i}]: user_id is required`,
        };
      }

      if (
        update.is_active !== undefined &&
        typeof update.is_active !== 'boolean'
      ) {
        return {
          code: 400,
          message: `updates[${i}]: is_active must be a boolean`,
        };
      }

      if (
        update.ttl !== undefined &&
        update.ttl !== null &&
        typeof update.ttl !== 'string'
      ) {
        return {
          code: 400,
          message: `updates[${i}]: ttl must be a string or null`,
        };
      }

      if (update.is_active === undefined && update.ttl === undefined) {
        return {
          code: 400,
          message: `updates[${i}]: At least one field (is_active or ttl) must be provided`,
        };
      }

      validatedUpdates.push({
        user_id: update.user_id,
        is_active: update.is_active,
        ttl: update.ttl,
      });
    }

    return validatedUpdates;
  }

  static validateCheckEmailRequired(
    project_id: string,
    project_type: string,
  ):
    | { project_id: string; project_type: ORGANIZATION_PROJECT_TYPE }
    | ServiceError {
    if (!project_id) {
      return { code: 400, message: 'project_id is required' };
    }

    if (
      !project_type ||
      !Object.values(ORGANIZATION_PROJECT_TYPE).includes(
        project_type as ORGANIZATION_PROJECT_TYPE,
      )
    ) {
      return {
        code: 400,
        message: `project_type is required and must be one of: ${Object.values(ORGANIZATION_PROJECT_TYPE).join(', ')}`,
      };
    }

    return {
      project_id,
      project_type: project_type as ORGANIZATION_PROJECT_TYPE,
    };
  }
}
