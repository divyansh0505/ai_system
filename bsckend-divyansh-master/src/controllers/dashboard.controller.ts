import type { Request, Response } from 'express';

import { MuttonResponder } from './mutton.response';
import { DashboardService } from '../services/dashboard.service';
import logger from '../utils/logger';
import type {
  StatsRequest,
  SessionsListRequest,
  VisitorDataRequest,
  ProjectSessionsRequest,
} from '../services/types/dashboard.types';

export class DashboardController {
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const {
        current_period_start_date,
        current_period_end_date,
        previous_period_start_date,
        previous_period_end_date,
        region,
      } = req.body as StatsRequest;

      const result = await DashboardService.getStats(
        new Date(current_period_start_date),
        new Date(current_period_end_date),
        new Date(previous_period_start_date),
        new Date(previous_period_end_date),
        organization_id,
        region,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_STATS_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_STATS', { error: (error as Error).message });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getSessionsList(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const { start_date, end_date, region, limit, offset } =
        req.body as SessionsListRequest;

      const result = await DashboardService.getSessionsList(
        new Date(start_date),
        new Date(end_date),
        organization_id,
        region,
        limit,
        offset,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_SESSIONS_LIST_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_SESSIONS_LIST', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getVisitorData(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;

      const request = req.body as VisitorDataRequest;

      const result = await DashboardService.getVisitorData(
        request,
        organization_id,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_VISITOR_DATA_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_VISITOR_DATA', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getSessionDetail(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { session_id } = req.params;

      const result = await DashboardService.getSessionDetail(
        session_id,
        organization_id,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_SESSION_DETAIL_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_SESSION_DETAIL', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }

  static async getProjectSessions(req: Request, res: Response): Promise<void> {
    try {
      const organization_id = req.headers.organization as string;
      const { project_id } = req.params;

      const request = req.body as ProjectSessionsRequest;

      const result = await DashboardService.getProjectSessions(
        project_id,
        organization_id,
        request,
      );

      if (typeof result === 'object' && 'code' in result) {
        logger.error('GET_PROJECT_SESSIONS_FAILED', { error: result.message });
        MuttonResponder.respond(res, result.code, null, result.message);
        return;
      }

      MuttonResponder.respond(res, 200, result);
      return;
    } catch (error) {
      logger.error('ERROR_GET_PROJECT_SESSIONS', {
        error: (error as Error).message,
      });
      MuttonResponder.respond(res, 500, null, 'Internal server error');
      return;
    }
  }
}
