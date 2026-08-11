import { Router } from 'express';

import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardAuthMiddleware } from '../middlewares/dashboard_auth.middleware';

const router = Router();

router.post(
  '/stats',
  DashboardAuthMiddleware.authenticate,
  DashboardController.getStats,
);

router.post(
  '/sessions',
  DashboardAuthMiddleware.authenticate,
  DashboardController.getSessionsList,
);

router.post(
  '/visitors',
  DashboardAuthMiddleware.authenticate,
  DashboardController.getVisitorData,
);

router.get(
  '/sessions/:session_id',
  DashboardAuthMiddleware.authenticate,
  DashboardController.getSessionDetail,
);

router.post(
  '/session/:project_id',
  DashboardAuthMiddleware.authenticate,
  DashboardController.getProjectSessions,
);

export default router;
