import type { Request, Response, NextFunction } from 'express';
import { MuttonResponder } from '../controllers/mutton.response';
import { OrganizationSharableLinkModel } from '../db/mongo/models/organization_sharable_link.model';
import { ORGANIZATION_PROJECT_TYPE } from '../db/mongo/models/types';
import {
  UserRepository,
  OrganizationSlidesRepository,
  OrganizationFlowsRepository,
  OrganizationRepository,
} from '../db/mongo/repository';
import type { CheckProjectAccessRequest } from '../services/types';
import logger from '../utils/logger';

interface ValidationError {
  code: number;
  message: string;
}

interface ValidatedAccessRequest {
  project_id: string;
  organization_project_type: ORGANIZATION_PROJECT_TYPE;
  user_email?: string;
}

export class OrganizationProjectMiddleware {
  static async verifyUserAccess(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Bypass for InteractNow demo organizations
    // TODO: remove this once we have a proper onboarding process for these orgs

    if (req.body.organization_id) {
      const organization = await OrganizationRepository.get({
        _id: req.body.organization_id,
      });
      if (organization?.is_interactnow_demo) {
        next();
        return;
      }
    }
    const validationResult =
      OrganizationProjectMiddlewareValidator.validateAccessRequest(
        req.body as CheckProjectAccessRequest,
      );

    if ('code' in validationResult) {
      MuttonResponder.respond(
        res,
        validationResult.code,
        null,
        validationResult.message,
      );
      return;
    }

    const isPubliclyVisible =
      await OrganizationProjectMiddleware.getActiveDeployedProject(
        validationResult.project_id,
        validationResult.organization_project_type,
        validationResult.user_email,
      );

    if (typeof isPubliclyVisible === 'object' && 'code' in isPubliclyVisible) {
      MuttonResponder.respond(
        res,
        isPubliclyVisible.code,
        null,
        isPubliclyVisible.message,
      );
      return;
    }

    if (isPubliclyVisible) {
      next();
      return;
    }

    const hasAccess = await OrganizationProjectMiddleware.verifyUserHasAccess(
      validationResult.user_email!,
      validationResult.project_id,
      validationResult.organization_project_type,
    );

    if (hasAccess !== true) {
      MuttonResponder.respond(res, hasAccess.code, null, hasAccess.message);
      return;
    }

    logger.info('USER_ACCESS_GRANTED', {
      user_email: validationResult.user_email,
      project_id: validationResult.project_id,
      organization_project_type: validationResult.organization_project_type,
    });

    next();
  }

  private static async verifyUserHasAccess(
    user_email: string,
    project_id: string,
    organization_project_type: ORGANIZATION_PROJECT_TYPE,
  ): Promise<true | ValidationError> {
    const user = await UserRepository.get({ email: user_email });
    if (!user) {
      logger.warn('USER_NOT_FOUND', { user_email, project_id });
      return {
        code: 403,
        message: 'User does not have access to this project',
      };
    }

    const sharableLink = await OrganizationSharableLinkModel.findOne({
      user_id: user._id,
      organization_project_id: project_id,
      organization_project_type,
      is_active: true,
    });

    if (!sharableLink) {
      logger.warn('USER_ACCESS_DENIED', {
        user_email,
        project_id,
        organization_project_type,
      });
      return {
        code: 403,
        message: 'User does not have access to this project',
      };
    }

    if (OrganizationProjectMiddlewareValidator.isExpired(sharableLink.ttl)) {
      logger.warn('USER_ACCESS_EXPIRED', {
        user_email,
        project_id,
        organization_project_type,
        ttl: sharableLink.ttl,
      });
      return { code: 403, message: 'Your access to this project has expired' };
    }

    return true;
  }

  private static async getActiveDeployedProject(
    project_id: string,
    organization_project_type: ORGANIZATION_PROJECT_TYPE,
    user_email?: string,
  ): Promise<boolean | ValidationError> {
    let deployedProject;
    if (organization_project_type === ORGANIZATION_PROJECT_TYPE.SLIDES) {
      deployedProject = await OrganizationSlidesRepository.get({
        organization_project_id: project_id,
      });
    }
    if (organization_project_type === ORGANIZATION_PROJECT_TYPE.FLOWS) {
      deployedProject = await OrganizationFlowsRepository.get({
        organization_project_id: project_id,
      });
    }

    if (!deployedProject) {
      logger.warn('DEPLOYED_PROJECT_NOT_FOUND', {
        project_id,
        organization_project_type,
      });
      return { code: 404, message: 'Project not found' };
    }

    if (!deployedProject.is_active) {
      logger.warn('PROJECT_NOT_ACTIVE', {
        project_id,
        organization_project_type,
      });
      return { code: 403, message: 'This project is not currently active' };
    }

    if (deployedProject.is_publicly_visible) {
      logger.info('PROJECT_PUBLICLY_VISIBLE_ACCESS_GRANTED', {
        project_id,
        organization_project_type,
      });
      return true;
    }

    if (!user_email) {
      return {
        code: 400,
        message: 'user_email is required for non-public projects',
      };
    }

    return false;
  }
}

class OrganizationProjectMiddlewareValidator {
  static validateAccessRequest(
    data: CheckProjectAccessRequest,
  ): ValidatedAccessRequest | ValidationError {
    if (!data.project_id || !data.organization_project_type) {
      return {
        code: 400,
        message: 'project_id and organization_project_type are required',
      };
    }

    if (
      !Object.values(ORGANIZATION_PROJECT_TYPE).includes(
        data.organization_project_type as ORGANIZATION_PROJECT_TYPE,
      )
    ) {
      return {
        code: 400,
        message: `organization_project_type must be one of: ${Object.values(ORGANIZATION_PROJECT_TYPE).join(', ')}`,
      };
    }

    return {
      project_id: data.project_id,
      organization_project_type:
        data.organization_project_type as ORGANIZATION_PROJECT_TYPE,
      user_email: data.user_email,
    };
  }

  static isExpired(ttl: string | undefined): boolean {
    if (!ttl) {
      return false;
    }
    return new Date(ttl) < new Date();
  }
}
