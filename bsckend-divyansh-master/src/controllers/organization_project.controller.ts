import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import {
  OrganizationProjectService,
  type CreateOrganizationProjectRequest,
  type ShareProjectRequest,
  type UpdateShareLinkRequest,
  type UpdateOrganizationProjectRequest,
} from '../services/organization_project.service';
import { ORGANIZATION_PROJECT_TYPE } from '../db/mongo/models/types';

import logger from '../utils/logger';

export class OrganizationProjectController {
  static async getProject(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const organization_project_id = req.params.organization_project_id;

      const result = await OrganizationProjectService.getProject(
        organization_id,
        organization_project_id,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_PROJECT_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_PROJECT', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const organization_project_id = req.params.organization_project_id;
      const projectType = req.query.type as ORGANIZATION_PROJECT_TYPE;
      const projectData = req.body as UpdateOrganizationProjectRequest;

      if (!projectType) {
        MuttonResponder.respond(
          res,
          400,
          null,
          'type query parameter is required',
        );
        return;
      }

      const result = await OrganizationProjectService.updateProject(
        organization_id,
        organization_project_id,
        projectType,
        projectData,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('UPDATE_PROJECT_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_UPDATE_PROJECT', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async createProject(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const projectType = req.query.type as ORGANIZATION_PROJECT_TYPE;
      const projectData = req.body as CreateOrganizationProjectRequest;
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const powerpointFile = files?.powerpointFile?.[0];
      const knowledgeBaseFile = files?.knowledgeBaseFile?.[0];

      const result = await OrganizationProjectService.createProject(
        organization_id,
        projectType,
        projectData,
        powerpointFile,
        knowledgeBaseFile,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('CREATE_PROJECT_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 201, result);
      return;
    } catch (error) {
      logger.error('ERROR_CREATE_PROJECT', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getShareLink(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const project_id = req.params.project_id;

      const result = await OrganizationProjectService.getShareLink(
        organization_id,
        project_id,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_SHARE_LINK_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_SHARE_LINK', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async shareProject(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const project_id = req.params.project_id;
      const shareData = req.body as ShareProjectRequest;

      logger.info('SHARE_PROJECT_REQUEST', {
        organization_id,
        project_id,
        is_domain: shareData.is_domain,
        has_email: !!shareData.email,
      });

      const result = await OrganizationProjectService.shareProject(
        organization_id,
        project_id,
        shareData,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('SHARE_PROJECT_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 201, result);
      return;
    } catch (error) {
      logger.error('ERROR_SHARE_PROJECT', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async updateShareLink(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const project_id = req.params.project_id;
      const updateData = req.body as UpdateShareLinkRequest;

      logger.info('UPDATE_SHARE_LINK_REQUEST', {
        organization_id,
        project_id,
        updateData,
      });

      const result = await OrganizationProjectService.updateShareLink(
        organization_id,
        project_id,
        updateData,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('UPDATE_SHARE_LINK_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_UPDATE_SHARE_LINK', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async checkEmailRequired(req: Request, res: Response): Promise<void> {
    try {
      const result = await OrganizationProjectService.checkEmailRequired(
        req.query.project_id as string,
        req.query.project_type as string,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('CHECK_EMAIL_REQUIRED_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_CHECK_EMAIL_REQUIRED', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }
}
