import { Types } from 'mongoose';

import { ORGANIZATION_PROJECT_TYPE } from '../../db/mongo/models/types';
import type {
  CreateOrganizationSlidesRequest,
  CreateOrganizationSlidesResponse,
  CreateOrganizationSlidesDto,
  SlideItemDto,
  SlideItemResponse,
} from '../types/organization_slides.types';
import type { CreateOrganizationProjectDto } from '../types/organization_project.types';

interface AnalyzedSlide {
  topic: string | null;
  layout_description: string | null;
  content_fields: string[];
  narration: string | null;
  image_url: string | null;
}

interface ConvertedSlide {
  s3_url: string;
  base64: string;
}

export class OrganizationSlidesConverter {
  static toSlideItemDto(analyzed: AnalyzedSlide, s3Url: string): SlideItemDto {
    return {
      topic: analyzed.topic ?? undefined,
      layout_description: analyzed.layout_description ?? undefined,
      content_fields: analyzed.content_fields,
      narration: analyzed.narration ?? undefined,
      image_url: s3Url,
    };
  }

  /**
   * Creates initial slide DTOs with only image_url populated.
   * Used when creating slides from PPTX before LLM analysis.
   */
  static toInitialSlideItemDtos(
    convertedSlides: ConvertedSlide[],
  ): SlideItemDto[] {
    return convertedSlides.map((slide) => ({
      image_url: slide.s3_url,
      topic: undefined,
      layout_description: undefined,
      content_fields: [],
      narration: undefined,
    }));
  }

  static toSlideItemDtos(
    analysisResults: AnalyzedSlide[],
    convertedSlides: ConvertedSlide[],
  ): SlideItemDto[] {
    return analysisResults.map((analyzed, index) =>
      this.toSlideItemDto(analyzed, convertedSlides[index].s3_url),
    );
  }

  static toSlideItemResponse(slide: SlideItemDto): SlideItemResponse {
    return {
      image_url: slide.image_url,
      narration: slide.narration,
    };
  }

  static toCreateResponse(
    projectId: Types.ObjectId,
    slidesId: Types.ObjectId,
    slides: SlideItemDto[],
  ): CreateOrganizationSlidesResponse {
    return {
      organization_project_id: projectId.toString(),
      organization_slides_id: slidesId.toString(),
      slides: slides.map((slide) => this.toSlideItemResponse(slide)),
    };
  }

  static toCreateProjectDto(
    organizationId: string,
    request: CreateOrganizationSlidesRequest,
  ): CreateOrganizationProjectDto {
    return {
      title: request.title,
      organization_id: new Types.ObjectId(organizationId),
      organization_project_type: ORGANIZATION_PROJECT_TYPE.SLIDES,
      avatar_id: request.avatar_id
        ? new Types.ObjectId(request.avatar_id)
        : undefined,
      voice_id: request.voice_id
        ? new Types.ObjectId(request.voice_id)
        : undefined,
      project_context: request.project_context,
    };
  }

  static toCreateSlidesDto(
    projectId: Types.ObjectId,
    organizationId: string,
    knowledgeBaseContent: string,
    thumbnail?: string,
  ): CreateOrganizationSlidesDto {
    return {
      organization_project_id: projectId,
      organization_id: new Types.ObjectId(organizationId),
      version: 1,
      slides: [],
      knowledge_base: knowledgeBaseContent || undefined,
      thumbnail,
    };
  }
}
