import { Types } from 'mongoose';

import { config } from '../../config';
import { PROMPT_CONFIG } from '../../config/prompt.config';

import {
  OrganizationRepository,
  OrganizationProjectRepository,
  OrganizationSlidesRepository,
  AvatarRepository,
  VoiceRepository,
} from '../db/mongo/repository';
import {
  ORGANIZATION_PROJECT_TYPE,
  SLIDES_CONVERSION_STATUS,
} from '../db/mongo/models/types';
import { S3Service } from '../utils/aws/s3';
import { SqsProducer } from '../utils/aws/sqs';
import logger from '../utils/logger';
import type { LLM_PROVIDER, SlideAnalysisResult, ServiceError } from './types';
import type {
  CreateOrganizationSlidesRequest,
  CreateOrganizationSlidesResponse,
  SlideItemDto,
  UpdateOrganizationSlidesRequest,
  UpdateOrganizationSlidesResponse,
} from './types/organization_slides.types';
import { LLMService } from './llm.service';
import { OrganizationSlidesConverter } from './converters/organization_slides.converter';
import { ImageUtils } from '../utils/image.utils';

interface ConvertedSlide {
  s3_url: string;
  base64: string;
}

interface AnalyzedSlide {
  topic: string | null;
  layout_description: string | null;
  content_fields: string[];
  narration: string | null;
  image_url: string | null;
}

interface KnowledgeBaseConvertResult {
  success: boolean;
  content: string;
  message?: string;
}

interface UpdateValidationResult {
  error: ServiceError | null;
  project: Awaited<ReturnType<typeof OrganizationProjectRepository.get>>;
  slides: Awaited<ReturnType<typeof OrganizationSlidesRepository.get>>;
}

class OrganizationSlidesValidator {
  static async validateCreate(
    organization_id: string,
    request: CreateOrganizationSlidesRequest,
  ): Promise<ServiceError | null> {
    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    return this.validateAvatarAndVoice(request.avatar_id, request.voice_id);
  }

  static async validateUpdate(
    organization_id: string,
    organization_project_id: string,
    request: UpdateOrganizationSlidesRequest,
  ): Promise<UpdateValidationResult> {
    const project = await OrganizationProjectRepository.get({
      _id: organization_project_id,
      organization_id: organization_id,
    });

    if (!project) {
      logger.warn('PROJECT_NOT_FOUND', { organization_project_id });
      return {
        error: { code: 404, message: 'Project not found' },
        project: null,
        slides: null,
      };
    }

    if (
      project.organization_project_type !== ORGANIZATION_PROJECT_TYPE.SLIDES
    ) {
      logger.warn('PROJECT_NOT_SLIDES_TYPE', { organization_project_id });
      return {
        error: { code: 400, message: 'Project is not a slides type' },
        project,
        slides: null,
      };
    }

    const slides = await OrganizationSlidesRepository.get({
      organization_project_id: organization_project_id,
      organization_id: organization_id,
    });

    if (!slides) {
      logger.warn('SLIDES_NOT_FOUND', { organization_project_id });
      return {
        error: { code: 404, message: 'Slides not found for this project' },
        project,
        slides: null,
      };
    }

    const avatarVoiceError = await this.validateAvatarAndVoice(
      request.avatar_id,
      request.voice_id,
    );
    if (avatarVoiceError) {
      return { error: avatarVoiceError, project, slides };
    }

    return { error: null, project, slides };
  }

  private static async validateAvatarAndVoice(
    avatar_id?: string,
    voice_id?: string,
  ): Promise<ServiceError | null> {
    if (avatar_id) {
      const avatar = await AvatarRepository.get({ _id: avatar_id });
      if (!avatar) {
        logger.warn('AVATAR_NOT_FOUND', { avatarId: avatar_id });
        return { code: 404, message: 'Avatar not found' };
      }
    }

    if (voice_id) {
      const voice = await VoiceRepository.get({ _id: voice_id });
      if (!voice) {
        logger.warn('VOICE_NOT_FOUND', { voiceId: voice_id });
        return { code: 404, message: 'Voice not found' };
      }
    }

    return null;
  }
}

export class OrganizationSlidesService {
  static async createFromPptx(
    organization_id: string,
    file: Express.Multer.File,
    request: CreateOrganizationSlidesRequest,
    knowledgeBaseFile?: Express.Multer.File,
  ): Promise<CreateOrganizationSlidesResponse | ServiceError> {
    logger.debug('CREATE_SLIDES_FROM_PPTX_REQUEST', {
      organization_id,
      title: request.title,
      fileName: file.originalname,
      hasKnowledgeBase: !!knowledgeBaseFile,
    });

    const validationError = await OrganizationSlidesValidator.validateCreate(
      organization_id,
      request,
    );
    if (validationError) {
      return validationError;
    }

    // Convert knowledge base file to string if provided
    let knowledgeBaseContent = '';
    if (knowledgeBaseFile) {
      const knowledgeBaseResult = await this.convertKnowledgeBaseToString(
        knowledgeBaseFile.buffer,
        knowledgeBaseFile.originalname,
      );

      if (!knowledgeBaseResult.success) {
        logger.warn('KNOWLEDGE_BASE_CONVERSION_FAILED', {
          organization_id,
          fileName: knowledgeBaseFile.originalname,
          message: knowledgeBaseResult.message,
        });
        return {
          code: 400,
          message:
            knowledgeBaseResult.message ||
            'Failed to convert knowledge base file',
        };
      }

      knowledgeBaseContent = knowledgeBaseResult.content;
    }

    // Step 1: Create OrganizationProject and OrganizationSlides entries first
    const projectDto = OrganizationSlidesConverter.toCreateProjectDto(
      organization_id,
      request,
    );
    const organizationProject =
      await OrganizationProjectRepository.create(projectDto);
    const project_id = organizationProject._id as Types.ObjectId;

    const slidesDto = OrganizationSlidesConverter.toCreateSlidesDto(
      project_id,
      organization_id,
      knowledgeBaseContent,
      request.thumbnail,
    );
    const organizationSlides =
      await OrganizationSlidesRepository.create(slidesDto);
    const slides_id = organizationSlides._id as Types.ObjectId;

    // Link project to slides
    await OrganizationProjectRepository.update(
      { _id: project_id },
      { deployed_organization_project_type_id: slides_id },
    );

    logger.info('SLIDES_PROJECT_CREATED', {
      organization_id,
      project_id: project_id.toString(),
      slides_id: slides_id.toString(),
    });

    // Helper to clean up created entries on failure
    const cleanupOnFailure = async (errorMessage: string) => {
      try {
        await Promise.all([
          OrganizationSlidesRepository.delete({ _id: slides_id }),
          OrganizationProjectRepository.delete({ _id: project_id }),
        ]);
        logger.info('SLIDES_CLEANUP_SUCCESS', {
          organization_id,
          project_id: project_id.toString(),
          slides_id: slides_id.toString(),
        });
      } catch (cleanupError) {
        logger.error('SLIDES_CLEANUP_FAILED', {
          organization_id,
          project_id: project_id.toString(),
          slides_id: slides_id.toString(),
          error: (cleanupError as Error).message,
        });
      }
      return { code: 500, message: errorMessage } as ServiceError;
    };

    try {
      // Step 2: Upload PPTX/PDF file to S3 for async processing
      const s3UploadResult = await S3Service.uploadOrganizationSlidesSource(
        file.buffer,
        organization_id,
        project_id.toString(),
        file.originalname,
      );

      if (!s3UploadResult) {
        logger.error('SLIDES_S3_UPLOAD_FAILED', {
          organization_id,
          project_id: project_id.toString(),
        });
        return cleanupOnFailure('Failed to upload presentation file');
      }

      // Update slides with S3 key for reference
      await OrganizationSlidesRepository.update(
        { _id: slides_id },
        {
          source_s3_key: s3UploadResult.key,
          conversion_status: SLIDES_CONVERSION_STATUS.PENDING,
        },
      );

      // Step 3: Send SQS message for async conversion
      const sqsPayload = {
        id: slides_id.toString(),
        message: {
          data: {
            organization_id,
            project_id: project_id.toString(),
            slides_id: slides_id.toString(),
            s3_source_url: s3UploadResult.url,
            s3_key: s3UploadResult.key,
            original_filename: file.originalname,
            knowledge_base_content: knowledgeBaseContent || undefined,
          },
        },
      };

      const sqsSendSuccess = await SqsProducer.send(
        config.aws.sqs.slidesConversionQueueUrl,
        sqsPayload,
      );

      if (!sqsSendSuccess) {
        logger.error('SLIDES_SQS_SEND_FAILED', {
          organization_id,
          project_id: project_id.toString(),
          slides_id: slides_id.toString(),
        });
        // Mark as failed but don't delete - can be retried
        await OrganizationSlidesRepository.update(
          { _id: slides_id },
          {
            conversion_status: SLIDES_CONVERSION_STATUS.FAILED,
            conversion_error: 'Failed to queue conversion job',
          },
        );
        return {
          code: 500,
          message: 'Failed to queue slides conversion',
        };
      }

      logger.info('SLIDES_CONVERSION_QUEUED', {
        organization_id,
        project_id: project_id.toString(),
        slides_id: slides_id.toString(),
        s3_key: s3UploadResult.key,
        hasKnowledgeBase: !!knowledgeBaseContent,
      });

      // Return immediately - conversion will happen asynchronously
      return OrganizationSlidesConverter.toCreateResponse(
        project_id,
        slides_id,
        [], // Empty slides array - will be populated by consumer
      );
    } catch (error) {
      logger.error('SLIDES_PROCESSING_FAILED', {
        organization_id,
        project_id: project_id.toString(),
        slides_id: slides_id.toString(),
        error: (error as Error).message,
      });
      return cleanupOnFailure('Failed to process slides');
    }
  }

  /**
   * Checks if this is the first patch (all narrations are null/empty).
   * Used to determine if we need to run initial LLM analysis.
   */
  private static isFirstPatch(slides: SlideItemDto[]): boolean {
    if (slides.length === 0) return true;
    return slides.every(
      (slide) => !slide.narration || slide.narration.trim() === '',
    );
  }

  /**
   * Checks if the request only contains metadata fields (no narration/content changes).
   * Used to determine if we should skip first patch LLM analysis.
   */
  private static isMetadataOnlyUpdate(
    request: UpdateOrganizationSlidesRequest,
  ): boolean {
    const hasNarrations = request.narrations && request.narrations.length > 0;
    return !hasNarrations;
  }

  static async updateSlides(
    organization_id: string,
    organization_project_id: string,
    request: UpdateOrganizationSlidesRequest,
  ): Promise<UpdateOrganizationSlidesResponse | ServiceError> {
    logger.debug('UPDATE_SLIDES_REQUEST', {
      organization_id,
      organization_project_id,
    });

    const { error, slides: existingSlides } =
      await OrganizationSlidesValidator.validateUpdate(
        organization_id,
        organization_project_id,
        request,
      );

    if (error || !existingSlides) {
      return error ?? { code: 500, message: 'Validation failed' };
    }

    // Check if this is the first patch (all narrations are empty)
    const isFirst = this.isFirstPatch(existingSlides.slides || []);

    // Only run initial analysis if it's the first patch AND request has content changes (narrations)
    // Skip for metadata-only updates (is_active, is_draft, etc.)
    if (isFirst && !this.isMetadataOnlyUpdate(request)) {
      logger.info('FIRST_PATCH_DETECTED', {
        organization_id,
        organization_project_id,
        slides_count: existingSlides.slides?.length || 0,
      });
      return this.runInitialSlideAnalysis(
        organization_id,
        organization_project_id,
        existingSlides,
        request,
      );
    }

    // Subsequent patches: only update metadata and narrations
    const slidesCount = existingSlides.slides?.length || 0;

    // Update project metadata
    const projectUpdate = this.buildProjectUpdate(request);

    if (Object.keys(projectUpdate).length > 0) {
      await OrganizationProjectRepository.update(
        { _id: organization_project_id },
        projectUpdate,
      );
    }

    // Update slides
    const slidesUpdate = await this.buildSlidesUpdate(
      request,
      existingSlides.slides || [],
      organization_project_id,
    );

    if (Object.keys(slidesUpdate).length > 0) {
      await OrganizationSlidesRepository.update(
        { _id: existingSlides._id },
        slidesUpdate,
      );
    }

    logger.info('SLIDES_UPDATED_SUCCESS', {
      organization_id,
      organization_project_id,
      slides_id: existingSlides._id.toString(),
      slides_count: slidesCount,
    });

    return {
      organization_project_id,
      organization_slides_id: (existingSlides._id as Types.ObjectId).toString(),
      slides_count: slidesCount,
    };
  }

  private static buildProjectUpdate(
    request: UpdateOrganizationSlidesRequest,
  ): Record<string, unknown> {
    return {
      ...(request.title && { title: request.title }),
      ...(request.description && { description: request.description }),
      ...(request.avatar_id && {
        avatar_id: new Types.ObjectId(request.avatar_id),
      }),
      ...(request.voice_id && {
        voice_id: new Types.ObjectId(request.voice_id),
      }),
      ...(request.project_context && {
        project_context: request.project_context,
      }),
    };
  }

  private static async buildSlidesUpdate(
    request: UpdateOrganizationSlidesRequest,
    existingSlides: SlideItemDto[],
    organization_project_id: string,
  ): Promise<Record<string, unknown>> {
    const thumbnail = request.thumbnail || existingSlides[0]?.image_url;

    const narrationUpdate = await this.buildNarrationUpdate(
      existingSlides,
      request.narrations,
      organization_project_id,
    );

    return {
      ...(request.is_active !== undefined && { is_active: request.is_active }),
      ...(request.is_draft !== undefined && { is_draft: request.is_draft }),
      ...(request.is_publicly_visible !== undefined && {
        is_publicly_visible: request.is_publicly_visible,
      }),
      ...(thumbnail && { thumbnail }),
      ...narrationUpdate,
    };
  }

  private static async buildNarrationUpdate(
    existingSlides: SlideItemDto[],
    narrations: UpdateOrganizationSlidesRequest['narrations'],
    organization_project_id: string,
  ): Promise<Record<string, unknown>> {
    if (!narrations || narrations.length === 0) {
      return {};
    }

    const narrationMap = new Map(
      narrations.map((n) => [n.image_url, n.narration]),
    );

    let updatedCount = 0;
    let skippedCount = 0;
    const updatedSlides = await Promise.all(
      existingSlides.map(async (slide) => {
        if (slide.image_url && narrationMap.has(slide.image_url)) {
          const userInstruction = narrationMap.get(slide.image_url);
          const existingNarration = slide.narration || '';

          // Only update if user instruction is not empty
          if (userInstruction && userInstruction.trim() !== '') {
            // Check if there's a difference between user instruction and existing narration
            // Skip LLM call if the instruction is the same as existing narration
            if (userInstruction.trim() === existingNarration.trim()) {
              skippedCount++;
              logger.debug('NARRATION_UPDATE_SKIPPED_NO_DIFF', {
                organization_project_id,
                image_url: slide.image_url,
              });
              return slide;
            }

            updatedCount++;
            // Pass existing narration and user instruction to LLM
            const modifiedNarration = await this.modifyNarration(
              existingNarration,
              userInstruction,
            );
            return { ...slide, narration: modifiedNarration };
          }
        }
        return slide;
      }),
    );

    logger.info('SLIDES_NARRATIONS_UPDATED', {
      organization_project_id,
      narrations_count: updatedCount,
      skipped_no_diff: skippedCount,
    });

    return { slides: updatedSlides, is_draft: false };
  }

  /**
   * Runs initial LLM slide analysis and narration generation on first PATCH.
   * Fetches images from S3 URLs, analyzes them with Gemini, and generates narrations.
   */
  private static async runInitialSlideAnalysis(
    organization_id: string,
    organization_project_id: string,
    existingSlides: NonNullable<
      Awaited<ReturnType<typeof OrganizationSlidesRepository.get>>
    >,
    request: UpdateOrganizationSlidesRequest,
  ): Promise<UpdateOrganizationSlidesResponse | ServiceError> {
    const slides = existingSlides.slides || [];
    const knowledgeBaseContent = existingSlides.knowledge_base || '';

    logger.info('INITIAL_SLIDE_ANALYSIS_START', {
      organization_id,
      organization_project_id,
      slides_count: slides.length,
      hasKnowledgeBase: !!knowledgeBaseContent,
    });

    // Set is_generation_running to true before LLM calls
    await OrganizationProjectRepository.update(
      { _id: organization_project_id },
      { is_generation_running: true },
    );

    // Step 1: Fetch all images from S3 URLs as base64
    const imageUrls = slides
      .map((s) => s.image_url)
      .filter((url): url is string => !!url);

    if (imageUrls.length === 0) {
      logger.warn('NO_IMAGE_URLS_FOUND', {
        organization_id,
        organization_project_id,
      });
      return { code: 400, message: 'No slide images found to analyze' };
    }

    const imageData = await ImageUtils.fetchImagesAsBase64(imageUrls);

    if (imageData.size === 0) {
      logger.error('IMAGE_FETCH_FAILED_ALL', {
        organization_id,
        organization_project_id,
        requested: imageUrls.length,
      });
      return {
        code: 500,
        message: 'Failed to fetch slide images for analysis',
      };
    }

    // Step 2: Create ConvertedSlide objects for analysis
    const convertedSlides: ConvertedSlide[] = slides.map((slide) => {
      const imgData = imageData.get(slide.image_url || '');
      return {
        s3_url: slide.image_url || '',
        base64: imgData?.base64 || '',
      };
    });

    // Step 3: Build user instructions map from request.narrations if provided
    const userInstructions = new Map<string, string>();
    if (request.narrations && request.narrations.length > 0) {
      for (const narration of request.narrations) {
        if (narration.image_url && narration.narration?.trim()) {
          userInstructions.set(narration.image_url, narration.narration.trim());
        }
      }
      logger.info('USER_INSTRUCTIONS_PROVIDED_FOR_FIRST_PATCH', {
        organization_project_id,
        instructionsCount: userInstructions.size,
      });
    }

    // Step 4: Run LLM slide analysis (parallel) and narration generation (batch)
    const analysisResult = await this.analyzeSlides(
      convertedSlides,
      knowledgeBaseContent,
      userInstructions,
    );

    if ('code' in analysisResult) {
      logger.error('INITIAL_SLIDE_ANALYSIS_FAILED', {
        organization_id,
        organization_project_id,
        error: analysisResult.message,
      });
      // Set is_generation_running to false on failure
      await OrganizationProjectRepository.update(
        { _id: organization_project_id },
        { is_generation_running: false },
      );
      return analysisResult;
    }

    // Step 4: Combine results
    const updatedSlides = OrganizationSlidesConverter.toSlideItemDtos(
      analysisResult,
      convertedSlides,
    );

    // Step 5: Apply project metadata updates from request and set is_generation_running to false
    const projectUpdate = this.buildProjectUpdate(request);
    await OrganizationProjectRepository.update(
      { _id: organization_project_id },
      { ...projectUpdate, is_generation_running: false },
    );

    // Step 6: Update slides with analysis results
    // Use user-provided is_active and is_draft values as truth, only default if not provided
    const thumbnail = request.thumbnail || updatedSlides[0]?.image_url;
    await OrganizationSlidesRepository.update(
      { _id: existingSlides._id },
      {
        slides: updatedSlides,
        thumbnail,
        // Respect user-provided values; only default to true if not explicitly set
        ...(request.is_draft !== undefined
          ? { is_draft: request.is_draft }
          : { is_draft: true }),
        ...(request.is_active !== undefined
          ? { is_active: request.is_active }
          : { is_active: true }),
        ...(request.is_publicly_visible !== undefined && {
          is_publicly_visible: request.is_publicly_visible,
        }),
      },
    );

    logger.info('INITIAL_SLIDE_ANALYSIS_SUCCESS', {
      organization_id,
      organization_project_id,
      slides_id: existingSlides._id.toString(),
      slides_count: updatedSlides.length,
    });

    return {
      organization_project_id,
      organization_slides_id: existingSlides._id.toString(),
      slides_count: updatedSlides.length,
    };
  }

  private static async analyzeSlide(
    base64Image: string,
    s3Url: string,
    slideIndex: number,
  ): Promise<AnalyzedSlide | ServiceError> {
    const { SLIDE_ANALYSIS } = PROMPT_CONFIG;

    logger.info('SLIDE_ANALYSIS_START', { slideIndex });

    const llmResponse = await LLMService.invokeLLM({
      provider: SLIDE_ANALYSIS.MODEL_CONFIG.provider as LLM_PROVIDER,
      model_to_use: SLIDE_ANALYSIS.MODEL_CONFIG.model,
      system_prompt: SLIDE_ANALYSIS.SYSTEM_PROMPT,
      user_input: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: SLIDE_ANALYSIS.USER_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: SLIDE_ANALYSIS.MODEL_CONFIG.max_tokens,
      temperature: SLIDE_ANALYSIS.MODEL_CONFIG.temperature,
    });

    if (typeof llmResponse === 'object' && 'code' in llmResponse) {
      logger.error('SLIDE_ANALYSIS_LLM_ERROR', {
        slideIndex,
        error: llmResponse,
      });
      return llmResponse;
    }

    try {
      const cleanedResponse = llmResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const analysisResult: SlideAnalysisResult = JSON.parse(cleanedResponse);

      logger.info('SLIDE_ANALYSIS_SUCCESS', {
        slideIndex,
        topic: analysisResult.topic,
      });

      return {
        topic: analysisResult.topic,
        layout_description: analysisResult.layout_description,
        content_fields: analysisResult.content_fields || [],
        narration: null,
        image_url: s3Url,
      };
    } catch (parseError) {
      logger.error('SLIDE_ANALYSIS_PARSE_ERROR', {
        slideIndex,
        error: (parseError as Error).message,
        llmResponse,
      });

      return {
        code: 500,
        message: 'Failed to parse LLM response',
        details: { parseError: (parseError as Error).message },
      };
    }
  }

  private static async analyzeSlides(
    slides: ConvertedSlide[],
    knowledgeBaseContent: string,
    userInstructions?: Map<string, string>,
  ): Promise<AnalyzedSlide[] | ServiceError> {
    logger.info('SLIDE_ANALYSIS_BATCH_START', {
      totalSlides: slides.length,
    });

    // Step 1: Analyze all slides in parallel to extract metadata
    const analysisPromises = slides.map((slide, index) =>
      this.analyzeSlide(slide.base64, slide.s3_url, index),
    );

    const results = await Promise.all(analysisPromises);

    const errors = results.filter(
      (result): result is ServiceError =>
        typeof result === 'object' && 'code' in result,
    );

    if (errors.length > 0) {
      logger.error('SLIDE_ANALYSIS_BATCH_PARTIAL_FAILURE', {
        totalSlides: slides.length,
        failedSlides: errors.length,
        errors: errors.map((e) => e.message),
      });

      if (errors.length === slides.length) {
        return {
          code: 500,
          message: 'All slide analyses failed',
          details: { errors: errors.map((e) => e.message) },
        };
      }
    }

    const successfulResults = results.filter(
      (result): result is AnalyzedSlide =>
        !(typeof result === 'object' && 'code' in result),
    );

    logger.info('SLIDE_ANALYSIS_BATCH_COMPLETE', {
      totalSlides: slides.length,
      successfulSlides: successfulResults.length,
      failedSlides: errors.length,
    });

    // Step 2: Generate narrations for all slides in a single call
    const narrations = await this.generateAllNarrations(
      successfulResults,
      knowledgeBaseContent,
      userInstructions,
    );

    // Step 3: Merge narrations into analyzed slides
    const slidesWithNarrations = successfulResults.map((slide, index) => ({
      ...slide,
      narration: narrations[index] || null,
    }));

    return slidesWithNarrations;
  }

  private static async generateAllNarrations(
    analyzedSlides: AnalyzedSlide[],
    knowledgeBaseContent: string,
    userInstructions?: Map<string, string>,
  ): Promise<string[]> {
    const { NARRATION_GENERATION } = PROMPT_CONFIG;

    logger.info('NARRATION_GENERATION_START', {
      totalSlides: analyzedSlides.length,
      hasKnowledgeBase: !!knowledgeBaseContent,
      hasUserInstructions: userInstructions ? userInstructions.size > 0 : false,
    });

    // Format slides metadata for the prompt, including user instructions if provided
    const slidesMetadata = analyzedSlides
      .map((slide, index) => {
        const userInstruction = slide.image_url
          ? userInstructions?.get(slide.image_url)
          : undefined;
        return `### Slide ${index + 1}
- Topic: ${slide.topic || 'N/A'}
- Layout: ${slide.layout_description || 'N/A'}
- Content Points: ${
          slide.content_fields.length > 0
            ? slide.content_fields.join(', ')
            : 'N/A'
        }${userInstruction ? `\n- User Instruction: ${userInstruction}` : ''}`;
      })
      .join('\n\n');

    const userPrompt = NARRATION_GENERATION.getUserPrompt(
      slidesMetadata,
      knowledgeBaseContent,
      userInstructions && userInstructions.size > 0,
    );

    const llmResponse = await LLMService.invokeLLM({
      provider: NARRATION_GENERATION.MODEL_CONFIG.provider as LLM_PROVIDER,
      model_to_use: NARRATION_GENERATION.MODEL_CONFIG.model,
      system_prompt: NARRATION_GENERATION.SYSTEM_PROMPT,
      user_input: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: NARRATION_GENERATION.MODEL_CONFIG.max_tokens,
      temperature: NARRATION_GENERATION.MODEL_CONFIG.temperature,
    });

    if (typeof llmResponse === 'object' && 'code' in llmResponse) {
      logger.error('NARRATION_GENERATION_LLM_ERROR', {
        error: llmResponse,
      });
      // Return empty narrations on failure
      return analyzedSlides.map(() => '');
    }

    try {
      // Clean markdown code blocks if present
      const cleanedResponse = llmResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const narrations: string[] = JSON.parse(cleanedResponse);

      logger.info('NARRATION_GENERATION_SUCCESS', {
        totalSlides: analyzedSlides.length,
        narrationsGenerated: narrations.length,
      });

      // Ensure we have the right number of narrations
      if (narrations.length !== analyzedSlides.length) {
        logger.warn('NARRATION_COUNT_MISMATCH', {
          expected: analyzedSlides.length,
          received: narrations.length,
        });
        // Pad or trim to match slide count
        while (narrations.length < analyzedSlides.length) {
          narrations.push('');
        }
        narrations.length = analyzedSlides.length;
      }

      return narrations;
    } catch (parseError) {
      logger.error('NARRATION_GENERATION_PARSE_ERROR', {
        error: (parseError as Error).message,
        llmResponse,
      });
      // Return empty narrations on parse failure
      return analyzedSlides.map(() => '');
    }
  }

  private static async modifyNarration(
    existingNarration: string,
    userInstruction: string,
  ): Promise<string> {
    const { NARRATION_MODIFICATION } = PROMPT_CONFIG;

    logger.debug('NARRATION_MODIFICATION_START', {
      existingNarrationLength: existingNarration?.length || 0,
      userInstructionLength: userInstruction.length,
    });

    const llmResponse = await LLMService.invokeLLM({
      provider: NARRATION_MODIFICATION.MODEL_CONFIG.provider as LLM_PROVIDER,
      model_to_use: NARRATION_MODIFICATION.MODEL_CONFIG.model,
      system_prompt: NARRATION_MODIFICATION.SYSTEM_PROMPT,
      user_input: [
        {
          role: 'user',
          content: NARRATION_MODIFICATION.getUserPrompt(
            existingNarration,
            userInstruction,
          ),
        },
      ],
      max_tokens: NARRATION_MODIFICATION.MODEL_CONFIG.max_tokens,
      temperature: NARRATION_MODIFICATION.MODEL_CONFIG.temperature,
    });

    if (typeof llmResponse === 'object' && 'code' in llmResponse) {
      logger.error('NARRATION_MODIFICATION_LLM_ERROR', {
        error: llmResponse,
      });
      // Return user instruction as fallback on LLM failure
      return userInstruction;
    }

    const modifiedNarration = llmResponse.trim();

    logger.info('NARRATION_MODIFICATION_SUCCESS', {
      existingNarrationLength: existingNarration?.length || 0,
      userInstructionLength: userInstruction.length,
      modifiedNarrationLength: modifiedNarration.length,
    });

    return modifiedNarration;
  }

  private static async convertKnowledgeBaseToString(
    buffer: Buffer,
    originalFilename: string,
  ): Promise<KnowledgeBaseConvertResult> {
    const formData = new FormData();
    const uint8Array = new Uint8Array(buffer);
    formData.append('file', new Blob([uint8Array]), originalFilename);

    try {
      const response = await fetch(
        `${config.dahi.baseUrl}/convert/doc-to-text`,
        {
          method: 'POST',
          headers: {
            'X-Dahi-Secret': config.dahi.secret,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('DAHI_KNOWLEDGE_BASE_API_REQUEST_FAILED', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        return {
          success: false,
          content: '',
          message: `API request failed with status ${response.status}: ${errorText}`,
        };
      }

      const result = (await response.json()) as { content: string };
      return {
        success: true,
        content: result.content,
      };
    } catch (error) {
      logger.error('DAHI_KNOWLEDGE_BASE_API_ERROR', {
        error: (error as Error).message,
      });
      return {
        success: false,
        content: '',
        message: (error as Error).message,
      };
    }
  }
}
