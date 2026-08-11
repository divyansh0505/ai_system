import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { OrganizationService } from '../services/organization.service';
import { OrganizationProjectService } from '../services/organization_project.service';
import logger from '../utils/logger';

export class OrganizationController {
  static async getOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const result =
        await OrganizationService.getFullOrganization(organization_id);

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_ORGANIZATION_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_ORGANIZATION', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const result =
        await OrganizationProjectService.getProjects(organization_id);

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_PROJECTS_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_PROJECTS', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async updateHubspotAccessToken(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { hubspot_access_token, hubspot_form_id } = req.body;

      const result = await OrganizationService.updateHubspotAccessToken(
        organization_id,
        hubspot_access_token,
        hubspot_form_id,
      );

      if (typeof result === 'object' && 'code' in result) {
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_UPDATE_HUBSPOT_ACCESS_TOKEN', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async verifyHubspotAccessToken(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { hubspot_access_token } = req.body;

      const result =
        await OrganizationService.verifyHubspotAccessToken(
          hubspot_access_token,
        );

      if (typeof result === 'object' && 'code' in result) {
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_VERIFY_HUBSPOT_ACCESS_TOKEN', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async checkHubspotTokenStatus(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const result =
        await OrganizationService.checkHubspotTokenStatus(organization_id);

      if (typeof result === 'object' && 'code' in result) {
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_CHECK_HUBSPOT_TOKEN_STATUS', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }
}
