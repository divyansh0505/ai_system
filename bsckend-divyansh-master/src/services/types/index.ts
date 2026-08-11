export interface ServiceError {
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

export * from './auth.types';
export * from './organization_project.types';
export * from './session.types';
export * from './user.types';
export * from './organization.types';
export * from './organization_user.types';
export * from './organization_config.types';
export * from './organization_slides.types';
export * from './organization_sharable_link.types';
export * from './llm.types';
export * from './organization_avatar.types';