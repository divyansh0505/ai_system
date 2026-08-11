import type { Application } from 'express';
import healthRoutes from './health.router';
import authRoutes from './auth.routes';
import userEnrichmentRoutes from './user_enrichment.routes';
import livekitRoutes from './livekit.routes';
import dashboardRoutes from './dashboard.routes';
import webhookRoutes from './webhook.routes';
import sessionRoutes from './session.routes';
import organizationRoutes from './organization.routes';
import organizationProjectRoutes from './organization_project.routes';
import llmRoutes from './llm.router';
import internalRoutes from './internal.routes';

export class Routes {
  static mountRoutes(app: Application) {
    app.use('/health', healthRoutes);
    app.use('/auth', authRoutes);
    app.use('/users', userEnrichmentRoutes);
    app.use('/livekit', livekitRoutes);
    app.use('/dashboard', dashboardRoutes);
    app.use('/webhooks', webhookRoutes);
    app.use('/sessions', sessionRoutes);
    app.use('/organization', organizationRoutes);
    app.use('/project', organizationProjectRoutes);
    app.use('/llm', llmRoutes);
    app.use('/internal', internalRoutes);
  }
}
