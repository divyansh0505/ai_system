import { Router } from 'express';

import { OrganizationProjectController } from '../controllers/organization_project.controller';
import { DashboardAuthMiddleware, MulterMiddleware } from '../middlewares';

const router = Router();

// Public endpoint - no authentication required (must be before parameterized routes)
router.get(
  '/email-requirement',
  OrganizationProjectController.checkEmailRequired,
);

router.get(
  '/:organization_project_id',
  DashboardAuthMiddleware.authenticate,
  OrganizationProjectController.getProject,
);

router.post(
  '/',
  DashboardAuthMiddleware.authenticate,
  MulterMiddleware.powerpointWithKnowledgeBase,
  OrganizationProjectController.createProject,
);

router.patch(
  '/:organization_project_id',
  DashboardAuthMiddleware.authenticate,
  OrganizationProjectController.updateProject,
);

router.get(
  '/:project_id/share',
  DashboardAuthMiddleware.authenticate,
  OrganizationProjectController.getShareLink,
);

router.post(
  '/:project_id/share',
  DashboardAuthMiddleware.authenticate,
  OrganizationProjectController.shareProject,
);

router.patch(
  '/:project_id/share',
  DashboardAuthMiddleware.authenticate,
  OrganizationProjectController.updateShareLink,
);

export default router;
