import { Router } from 'express';

import { OrganizationController } from '../controllers/organization.controller';
import { OrganizationAvatarController } from '../controllers/organization_avatar.controller';
import { OrganizationVoiceController } from '../controllers/organization_voice.controller';
import { DashboardAuthMiddleware, MulterMiddleware } from '../middlewares';

const router = Router();

router.get(
  '/',
  DashboardAuthMiddleware.authenticate,
  OrganizationController.getOrganization,
);

router.get(
  '/projects',
  DashboardAuthMiddleware.authenticate,
  OrganizationController.getProjects,
);

router.post(
  '/avatar',
  DashboardAuthMiddleware.authenticate,
  MulterMiddleware.image,
  OrganizationAvatarController.createCustomAvatar,
);

router.get(
  '/avatars',
  DashboardAuthMiddleware.authenticate,
  OrganizationAvatarController.getAvatars,
);

router.delete(
  '/avatar/:avatar_id',
  DashboardAuthMiddleware.authenticate,
  OrganizationAvatarController.deleteAvatar,
);

router.post(
  '/voice',
  DashboardAuthMiddleware.authenticate,
  MulterMiddleware.audio,
  OrganizationVoiceController.createCustomVoice,
);

router.get(
  '/voices',
  DashboardAuthMiddleware.authenticate,
  OrganizationVoiceController.getVoices,
);

router.patch(
  '/voice/:voice_id',
  DashboardAuthMiddleware.authenticate,
  OrganizationVoiceController.updateVoice,
);

router.patch(
  '/hubspot/token',
  DashboardAuthMiddleware.authenticate,
  OrganizationController.updateHubspotAccessToken,
);

router.post(
  '/hubspot/verify',
  DashboardAuthMiddleware.authenticate,
  OrganizationController.verifyHubspotAccessToken,
);

router.get(
  '/hubspot/status',
  DashboardAuthMiddleware.authenticate,
  OrganizationController.checkHubspotTokenStatus,
);

export default router;
