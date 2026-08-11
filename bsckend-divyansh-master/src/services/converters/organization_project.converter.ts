import type { Types } from 'mongoose';

import {
  ORGANIZATION_PROJECT_TYPE,
  type OrganizationProject,
  type OrganizationSlides,
  type OrganizationFlows,
} from '../../db/mongo/models/types';
import type {
  OrganizationProjectItem,
  GetProjectResponse,
  OrganizationSlidesResponse,
  OrganizationFlowsResponse,
  SlideItemResponse,
  ShareDetails,
  PageItem,
  ProjectMetadata,
} from '../organization_project.service';

export class OrganizationProjectConverter {
  static toProjectItem(
    project: OrganizationProject,
    metadata?: ProjectMetadata,
  ): OrganizationProjectItem {
    const projectId = (project._id as Types.ObjectId).toString();
    const deployedTypeId =
      project.deployed_organization_project_type_id?.toString();

    return {
      organization_project_id: projectId,
      title: project.title,
      description: project.description,
      organization_project_type: project.organization_project_type,
      organization_flow_id:
        project.organization_project_type === ORGANIZATION_PROJECT_TYPE.FLOWS
          ? deployedTypeId
          : undefined,
      organization_slides_id:
        project.organization_project_type === ORGANIZATION_PROJECT_TYPE.SLIDES
          ? deployedTypeId
          : undefined,
      thumbnail: metadata?.thumbnail,
      is_active: metadata?.is_active,
      is_draft: metadata?.is_draft,
      is_generation_running: project.is_generation_running ?? false,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  static toProjectItems(
    projects: OrganizationProject[],
    metadataMap?: Map<string, ProjectMetadata>,
  ): OrganizationProjectItem[] {
    return projects.map((project) => {
      const deployedTypeId =
        project.deployed_organization_project_type_id?.toString();
      const metadata = deployedTypeId
        ? metadataMap?.get(deployedTypeId)
        : undefined;
      return this.toProjectItem(project, metadata);
    });
  }

  static toSlidesResponse(
    slides: OrganizationSlides,
  ): OrganizationSlidesResponse {
    return {
      organization_slides_id: (slides._id as Types.ObjectId).toString(),
      version: slides.version,
      knowledge_base: slides.knowledge_base,
      thumbnail: slides.thumbnail,
      is_active: slides.is_active,
      is_publicly_visible: slides.is_publicly_visible,
      slides: (slides.slides || []).map(
        (slide): SlideItemResponse => ({
          narration: slide.narration,
          image_url: slide.image_url,
        }),
      ),
    };
  }

  static toFlowsResponse(
    flows: OrganizationFlows,
    pages?: PageItem[],
  ): OrganizationFlowsResponse {
    return {
      organization_flow_id: (flows._id as Types.ObjectId).toString(),
      title: flows.title,
      description: flows.description,
      instructions: flows.instructions,
      thumbnail: flows.thumbnail,
      is_active: flows.is_active,
      is_publicly_visible: flows.is_publicly_visible,
      pages: pages || [],
    };
  }

  static toGetProjectResponse(
    project: OrganizationProject,
    slides?: OrganizationSlides | null,
    flows?: OrganizationFlows | null,
    share?: ShareDetails,
    pages?: PageItem[],
  ): GetProjectResponse {
    // Get is_publicly_visible from slides or flows
    const is_publicly_visible =
      slides?.is_publicly_visible ?? flows?.is_publicly_visible ?? false;

    return {
      organization_project_id: (project._id as Types.ObjectId).toString(),
      title: project.title,
      description: project.description,
      avatar_id: project.avatar_id?.toString(),
      voice_id: project.voice_id?.toString(),
      organization_project_type: project.organization_project_type,
      deployed_organization_project_type_id:
        project.deployed_organization_project_type_id?.toString(),
      project_context: project.project_context,
      is_publicly_visible,
      is_generation_running: project.is_generation_running ?? false,
      organization_slides: slides ? this.toSlidesResponse(slides) : undefined,
      organization_flows: flows
        ? this.toFlowsResponse(flows, pages)
        : undefined,
      share,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }
}
