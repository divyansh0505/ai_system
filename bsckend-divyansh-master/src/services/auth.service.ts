import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import mongoose, { type ClientSession, type Types } from 'mongoose';

import { config } from '../../config';
import {
  OrganizationRepository,
  OrganizationConfigRepository,
  OrganizationUserRepository,
  OrganizationUserRoleRepository,
  RoleRepository,
  OtpSessionRepository,
  AvatarRepository,
  VoiceRepository,
  OrganizationAvatarRepository,
  OrganizationVoiceRepository,
} from '../db/mongo/repository';
import {
  OTP_PURPOSE,
  PUBLIC_DOMAIN,
  TOKEN_TYPE,
  ORGANIZATION_PROJECT_TYPE,
  type Organization,
  type OrganizationUser,
  type OtpSession,
} from '../db/mongo/models/types';
import { EmailTemplateGenerator } from '../generator/email_template.generator';
import logger from '../utils/logger';
import { SESService } from '../utils/aws/ses';
import { JWT } from './jwt.service';
import type { ServiceError } from './types';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPairResponse,
  TokenRefreshRequest,
  OrganizationTokenPairResponse,
  OrganizationLoginResponse,
  OrganizationLoginRequest,
  OrganizationSignupResponse,
  OrganizationSignupRequest,
  GenerateOtpRequest,
  GenerateOtpResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  OtpSignupResponse,
  OtpSignupRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from './types/auth.types';

const PUBLIC_DOMAINS = Object.values(PUBLIC_DOMAIN) as string[];

const OTP_EXPIRY_SECONDS = 120;
const PASSWORD_RESET_EXPIRY_SECONDS = 900;

interface CreateOrganizationWithUserParams {
  email: string;
  password: string;
  domain: string;
  organization_name: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
  }

  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await Bun.password.verify(plainPassword, hashedPassword);
  }

  static generateOrganizationToken(
    userId: string,
    email: string,
    tokenType: TOKEN_TYPE,
  ): string {
    const payload = {
      user_id: userId,
      email: email,
      type: tokenType,
      is_dashboard: true,
    };

    const secret =
      tokenType === TOKEN_TYPE.ACCESS
        ? config.jwt.accessTokenSecret
        : config.jwt.refreshTokenSecret;

    const expiresIn =
      tokenType === TOKEN_TYPE.ACCESS
        ? config.jwt.accessTokenTtl
        : config.jwt.refreshTokenTtl;

    return jwt.sign(payload, secret, {
      expiresIn: expiresIn,
    });
  }

  static async generateTokens(
    organization_id: string,
  ): Promise<TokenPairResponse | ServiceError> {
    logger.debug('GENERATE_TOKENS_REQUEST', {
      organization_id: organization_id,
    });

    const validationResult =
      AuthValidator.validateOrganizationId(organization_id);
    if (validationResult) {
      logger.warn('GENERATE_TOKENS_VALIDATION_FAILED', {
        organization_id: organization_id,
        error: validationResult.message,
      });
      return validationResult;
    }

    const orgValidation =
      await AuthValidator.validateOrganizationExistsAndActive(organization_id);
    if ('code' in orgValidation) {
      return orgValidation;
    }

    const { config_id } = orgValidation;

    const accessPayload: AccessTokenPayload = {
      organization_id: organization_id,
      organization_config_id: config_id,
      role_id: '',
    };

    const refreshPayload: RefreshTokenPayload = {
      user_id: organization_id,
    };

    const accessToken = JWT.generateAccessToken(accessPayload);
    const refreshToken = JWT.generateRefreshToken(refreshPayload);

    logger.info('TOKENS_GENERATED', { organization_id: organization_id });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  static async refreshTokens(
    refresh_token: string,
  ): Promise<TokenPairResponse | ServiceError> {
    logger.debug('REFRESH_TOKENS_REQUEST');

    const validationResult = AuthValidator.validateRefreshToken(refresh_token);
    if (validationResult) {
      logger.warn('REFRESH_TOKENS_VALIDATION_FAILED', {
        error: validationResult.message,
      });
      return validationResult;
    }

    const payload = JWT.verifyRefreshToken(refresh_token);

    const orgValidation =
      await AuthValidator.validateOrganizationExistsAndActive(payload.user_id);
    if ('code' in orgValidation) {
      return orgValidation;
    }

    const { config_id } = orgValidation;

    const accessPayload: AccessTokenPayload = {
      organization_id: payload.user_id,
      organization_config_id: config_id,
      role_id: '',
    };

    const refreshPayload: RefreshTokenPayload = {
      user_id: payload.user_id,
    };

    const newAccessToken = JWT.generateAccessToken(accessPayload);
    const newRefreshToken = JWT.generateRefreshToken(refreshPayload);

    logger.info('TOKENS_REFRESHED', { user_id: payload.user_id });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  static async loginOrganization(
    request: OrganizationLoginRequest,
  ): Promise<OrganizationLoginResponse | ServiceError> {
    const { email, password } = request;
    logger.debug('ORGANIZATION_LOGIN_REQUEST', { email });

    const validationResult = AuthValidator.validateEmailAndPassword(
      email,
      password,
    );
    if (validationResult) {
      logger.warn('ORGANIZATION_LOGIN_VALIDATION_FAILED', {
        email,
        error: validationResult.message,
      });
      return validationResult;
    }

    const userValidation =
      await AuthValidator.validateUserExistsAndActive(email);
    if ('code' in userValidation) {
      return userValidation;
    }

    const { user } = userValidation;

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('ORGANIZATION_USER_INVALID_PASSWORD', { email });
      return { code: 401, message: 'Invalid email or password' };
    }

    const userId = (user._id as Types.ObjectId).toString();
    const accessToken = this.generateOrganizationToken(
      userId,
      email,
      TOKEN_TYPE.ACCESS,
    );
    const refreshToken = this.generateOrganizationToken(
      userId,
      email,
      TOKEN_TYPE.REFRESH,
    );

    const userRole = await OrganizationUserRoleRepository.get({
      organization_user_id: user._id,
      is_active: true,
    });

    const organizationId = userRole
      ? userRole.organization_id.toString()
      : null;

    logger.info('ORGANIZATION_LOGIN_SUCCESS', { email, user_id: userId });

    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        access_token_expires_in: config.jwt.accessTokenTtl,
        refresh_token_expires_in: config.jwt.refreshTokenTtl,
      },
      user_id: userId,
      email,
      organization_id: organizationId,
    };
  }

  static async refreshOrganizationTokens(
    request: TokenRefreshRequest,
  ): Promise<OrganizationTokenPairResponse | ServiceError> {
    const { refresh_token } = request;
    logger.debug('ORGANIZATION_REFRESH_REQUEST');

    const validationResult = AuthValidator.validateRefreshToken(refresh_token);
    if (validationResult) {
      logger.warn('ORGANIZATION_REFRESH_VALIDATION_FAILED', {
        error: validationResult.message,
      });
      return validationResult;
    }

    const payload = JWT.verifyDashboardRefreshToken(refresh_token);

    if (!payload.is_dashboard) {
      return { code: 401, message: 'Invalid dashboard token' };
    }

    if (payload.type !== 'refresh') {
      return { code: 401, message: 'Invalid token type' };
    }

    const newAccessToken = this.generateOrganizationToken(
      payload.user_id,
      payload.email,
      TOKEN_TYPE.ACCESS,
    );
    const newRefreshToken = this.generateOrganizationToken(
      payload.user_id,
      payload.email,
      TOKEN_TYPE.REFRESH,
    );

    logger.info('ORGANIZATION_TOKENS_REFRESHED', { user_id: payload.user_id });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'bearer',
      access_token_expires_in: config.jwt.accessTokenTtl,
      refresh_token_expires_in: config.jwt.refreshTokenTtl,
    };
  }

  static async signupOrganization(
    request: OrganizationSignupRequest,
  ): Promise<OrganizationSignupResponse | ServiceError> {
    const { email, password, organization_id, role_id, first_name, last_name } =
      request;

    logger.debug('ORGANIZATION_SIGNUP_REQUEST', { email, organization_id });

    const validationResult =
      AuthValidator.validateEmailPasswordAndOrganizationId(
        email,
        password,
        organization_id,
      );
    if (validationResult) {
      logger.warn('ORGANIZATION_SIGNUP_VALIDATION_FAILED', {
        email,
        organization_id,
        error: validationResult.message,
      });
      return validationResult;
    }

    const userExistsCheck = await AuthValidator.validateUserDoesNotExist(email);
    if (userExistsCheck) {
      return userExistsCheck;
    }

    const orgValidation =
      await AuthValidator.validateOrganizationExists(organization_id);
    if ('code' in orgValidation) {
      return orgValidation;
    }

    const { organization } = orgValidation;

    const hashedPassword = await this.hashPassword(password);

    const createdUser = await OrganizationUserRepository.create({
      email,
      password: hashedPassword,
      first_name: first_name,
      last_name: last_name,
      is_active: true,
    });

    if (!createdUser) {
      logger.error('ORGANIZATION_USER_CREATION_FAILED', { email });
      return { code: 500, message: 'Failed to create user' };
    }

    const userId = (createdUser._id as Types.ObjectId).toString();

    let finalRoleId = role_id;
    if (!finalRoleId) {
      const roleValidation = await AuthValidator.validateAdminRoleExists();
      if ('code' in roleValidation) {
        return roleValidation;
      }
      finalRoleId = roleValidation.role_id;
    }

    const createdUserRole = await OrganizationUserRoleRepository.create({
      organization_user_id: createdUser._id,
      organization_id: organization._id,
      role_id: finalRoleId as unknown,
      is_active: true,
    } as Parameters<typeof OrganizationUserRoleRepository.create>[0]);

    if (!createdUserRole) {
      logger.error('FAILED_TO_CREATE_ORGANIZATION_USER_ROLE', {
        user_id: userId,
        organization_id,
        role_id: finalRoleId,
      });
      return { code: 500, message: 'Failed to assign user role' };
    }

    logger.info('ORGANIZATION_SIGNUP_SUCCESS', {
      email,
      user_id: userId,
      organization_id,
    });

    return {
      user_id: userId,
      email,
    };
  }

  static async generateOtp(
    request: GenerateOtpRequest,
  ): Promise<GenerateOtpResponse | ServiceError> {
    const { email } = request;

    const validationResult = AuthValidator.validateEmail(email);
    if (validationResult) {
      logger.warn('GENERATE_OTP_VALIDATION_FAILED', {
        email,
        error: validationResult.message,
      });
      return validationResult;
    }

    // Transform email to domain (synthetic for public domains)
    const domain = this.transformEmailToDomain(email);
    if (typeof domain !== 'string') {
      return domain;
    }

    logger.info('GENERATE_OTP_DOMAIN_EXTRACTED', {
      email,
      domain,
      is_synthetic: this.isSyntheticDomain(domain),
    });

    const domainCheck = await AuthValidator.validateDomainNotRegistered(domain);
    if (domainCheck) {
      return domainCheck;
    }

    const userExistsCheck = await AuthValidator.validateUserDoesNotExist(email);
    if (userExistsCheck) {
      return userExistsCheck;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = dayjs().add(OTP_EXPIRY_SECONDS, 'seconds').toDate();

    const invalidateResult = await OtpSessionRepository.update(
      {
        email,
        session_type: OTP_PURPOSE.SIGNUP_OTP,
      },
      { is_used: true },
    );

    if (!invalidateResult) {
      logger.warn('FAILED_TO_INVALIDATE_OLD_OTP_SESSIONS', { email });
    }

    const otpSession = await OtpSessionRepository.create({
      email,
      otp,
      otp_expires_at: otpExpiresAt,
      session_type: OTP_PURPOSE.SIGNUP_OTP,
    });

    if (!otpSession) {
      logger.error('OTP_SESSION_CREATION_FAILED', { email });
      return { code: 500, message: 'Failed to create OTP session' };
    }

    const sendEmailResult = await this.sendOtpEmail(email, otp);
    if ('code' in sendEmailResult) {
      return sendEmailResult;
    }

    logger.info('OTP_GENERATED_SUCCESS', { email, otp });

    return {
      message: 'OTP sent successfully',
      email,
    };
  }

  static async verifyOtp(
    request: OtpVerifyRequest,
  ): Promise<OtpVerifyResponse | ServiceError> {
    const { email, otp } = request;

    const validationResult = AuthValidator.validateEmailAndOtp(email, otp);
    if (validationResult) {
      logger.warn('OTP_VERIFY_VALIDATION_FAILED', {
        email,
        error: validationResult.message,
      });
      return validationResult;
    }

    const otpSession = await OtpSessionRepository.get({
      email,
      session_type: OTP_PURPOSE.SIGNUP_OTP,
      is_used: false,
    });

    const otpValidation = await AuthValidator.validateOtpForVerification(
      email,
      otp,
      otpSession,
    );
    if (otpValidation) {
      return otpValidation;
    }

    const updateResult = await OtpSessionRepository.update(
      { _id: otpSession!._id },
      { is_verified: true },
    );

    if (!updateResult) {
      logger.error('FAILED_TO_MARK_OTP_VERIFIED', { email });
      return {
        code: 500,
        message:
          'OTP is valid but we could not save verification status. Please try again.',
      };
    }

    logger.info('OTP_VERIFIED_SUCCESS', { email });

    return {
      message: 'OTP verified successfully',
      email,
      is_verified: true,
    };
  }

  static async otpSignup(
    request: OtpSignupRequest,
  ): Promise<OtpSignupResponse | ServiceError> {
    const validationResult = AuthValidator.validateEmailAndPassword(
      request.email,
      request.password,
    );
    if (validationResult) {
      logger.warn('OTP_SIGNUP_VALIDATION_FAILED', {
        email: request.email,
        error: validationResult.message,
      });
      return validationResult;
    }

    const otpValidation = await AuthValidator.validateOtpSessionVerified(
      request.email,
    );
    if ('code' in otpValidation) {
      return otpValidation;
    }

    // Transform email to domain (synthetic for public domains)
    const domain = this.transformEmailToDomain(request.email);
    if (typeof domain !== 'string') {
      return domain;
    }

    logger.info('OTP_SIGNUP_DOMAIN_EXTRACTED', {
      email: request.email,
      domain,
      is_synthetic: this.isSyntheticDomain(domain),
    });

    const domainCheck = await AuthValidator.validateDomainNotRegistered(domain);
    if (domainCheck) {
      return domainCheck;
    }

    const userExistsCheck = await AuthValidator.validateUserDoesNotExist(
      request.email,
    );
    if (userExistsCheck) {
      return userExistsCheck;
    }

    const email = request.email;
    const password = request.password;
    const organization_name = request.organization_name;
    const first_name = request.first_name;
    const last_name = request.last_name;

    const createOrgDto = {
      email,
      password,
      domain,
      organization_name,
      first_name,
      last_name,
    } as CreateOrganizationWithUserParams;

    const organizationResult =
      await this.createOrganizationWithUser(createOrgDto);

    if ('code' in organizationResult) {
      return organizationResult;
    }

    const user_id = organizationResult.user_id;
    const organization_id = organizationResult.organization_id;

    const accessToken = this.generateOrganizationToken(
      user_id,
      request.email,
      TOKEN_TYPE.ACCESS,
    );
    const refreshToken = this.generateOrganizationToken(
      user_id,
      request.email,
      TOKEN_TYPE.REFRESH,
    );

    logger.info('OTP_SIGNUP_SUCCESS', {
      email: request.email,
      user_id,
      organization_id,
    });

    return {
      user_id,
      email: request.email,
      organization_id,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        access_token_expires_in: config.jwt.accessTokenTtl,
        refresh_token_expires_in: config.jwt.refreshTokenTtl,
      },
    };
  }

  static async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse | ServiceError> {
    const { email } = request;

    const validationResult = AuthValidator.validateEmail(email);
    if (validationResult) {
      logger.warn('FORGOT_PASSWORD_VALIDATION_FAILED', {
        email,
        error: validationResult.message,
      });
      return validationResult;
    }

    const userValidation = await AuthValidator.validateUserExists(email);
    if ('code' in userValidation) {
      return userValidation;
    }

    const createdAt = Math.floor(Date.now() / 1000);
    const expiresAt = createdAt + PASSWORD_RESET_EXPIRY_SECONDS;

    const resetToken = jwt.sign(
      {
        email,
        created_at: createdAt,
        expires_at: expiresAt,
      },
      config.jwt.refreshTokenSecret,
      {
        expiresIn: PASSWORD_RESET_EXPIRY_SECONDS,
      },
    );

    const resetUrl = `${config.adminDashboard.baseUrl}/reset-password?token=${resetToken}`;

    const sendEmailResult = await this.sendPasswordResetEmail(email, resetUrl);
    if ('code' in sendEmailResult) {
      return sendEmailResult;
    }

    logger.info('FORGOT_PASSWORD_SUCCESS', { email, resetUrl });

    return {
      message: 'Password reset link has been sent to your email',
      email,
    };
  }

  static async resetPassword(
    request: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse | ServiceError> {
    const { token, password } = request;

    const validationResult = AuthValidator.validateTokenAndPassword(
      token,
      password,
    );
    if (validationResult) {
      logger.warn('RESET_PASSWORD_VALIDATION_FAILED', {
        error: validationResult.message,
      });
      return validationResult;
    }

    const tokenValidation =
      await AuthValidator.validateResetPasswordToken(token);
    if ('code' in tokenValidation) {
      return tokenValidation;
    }

    const { email } = tokenValidation;

    const hashedPassword = await this.hashPassword(password);

    const updatedUser = await OrganizationUserRepository.update(
      { email },
      { password: hashedPassword },
    );

    if (!updatedUser) {
      logger.error('PASSWORD_UPDATE_FAILED', { email });
      return { code: 500, message: 'Failed to update password' };
    }

    logger.info('RESET_PASSWORD_SUCCESS', { email });

    return {
      message: 'Password reset successfully',
    };
  }

  private static async createOrganizationWithUser(
    params: CreateOrganizationWithUserParams,
  ): Promise<{ user_id: string; organization_id: string } | ServiceError> {
    const {
      email,
      password,
      domain,
      organization_name,
      first_name,
      last_name,
    } = params;
    const dbSession: ClientSession = await mongoose.startSession();

    try {
      dbSession.startTransaction();

      const hashedPassword = await this.hashPassword(password);

      const organizationConfig = await OrganizationConfigRepository.create(
        { settings: {} },
        dbSession,
      );

      if (!organizationConfig) {
        throw new Error('Failed to create organization config');
      }

      const organization = await OrganizationRepository.create(
        {
          name: organization_name || domain,
          domain,
          organization_config_id: organizationConfig._id as Types.ObjectId,
          is_active: true,
        },
        dbSession,
      );

      if (!organization) {
        throw new Error('Failed to create organization');
      }

      const organizationId = (organization._id as Types.ObjectId).toString();

      await OrganizationConfigRepository.update(
        { _id: organizationConfig._id },
        { organization_id: organization._id as Types.ObjectId },
        dbSession,
      );

      const organizationUser = await OrganizationUserRepository.create(
        {
          email,
          password: hashedPassword,
          first_name: first_name,
          last_name: last_name,
          is_active: true,
        },
        dbSession,
      );

      if (!organizationUser) {
        throw new Error('Failed to create organization user');
      }

      const userId = (organizationUser._id as Types.ObjectId).toString();

      const roleValidation = await AuthValidator.validateAdminRoleExists();
      if ('code' in roleValidation) {
        throw new Error(roleValidation.message);
      }

      const organizationUserRole = await OrganizationUserRoleRepository.create(
        {
          organization_user_id: organizationUser._id as Types.ObjectId,
          organization_id: organization._id as Types.ObjectId,
          role_id: roleValidation.role_id as unknown as Types.ObjectId,
          is_active: true,
        },
        dbSession,
      );

      if (!organizationUserRole) {
        throw new Error('Failed to create organization user role');
      }

      // Fetch default avatars and voices, then create org associations in parallel
      const [defaultAvatars, defaultVoices] = await Promise.all([
        AvatarRepository.getMany({ is_custom_generated: false }),
        VoiceRepository.getMany({ is_custom_generated: false }),
      ]);

      await Promise.all([
        ...defaultAvatars.map((avatar) =>
          OrganizationAvatarRepository.create(
            {
              organization_id: organization._id as Types.ObjectId,
              avatar_id: avatar._id as Types.ObjectId,
              is_active: true,
            },
            dbSession,
          ),
        ),
        ...defaultVoices.map((voice) =>
          OrganizationVoiceRepository.create(
            {
              organization_id: organization._id as Types.ObjectId,
              voice_id: voice._id as Types.ObjectId,
              is_active: true,
            },
            dbSession,
          ),
        ),
      ]);

      // Create default agent for the organization
      await OrganizationConfigRepository.update(
        { _id: organizationConfig._id },
        {
          agents: [
            {
              project_type: ORGANIZATION_PROJECT_TYPE.SLIDES,
              agent_name: 'slides-agent',
              is_active: true,
            },
          ],
        },
        dbSession,
      );

      await OtpSessionRepository.update(
        { email, session_type: OTP_PURPOSE.SIGNUP_OTP },
        { is_used: true },
      );

      await dbSession.commitTransaction();
      dbSession.endSession();

      return {
        user_id: userId,
        organization_id: organizationId,
      };
    } catch (error) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      logger.error('CREATE_ORGANIZATION_WITH_USER_FAILED', {
        email,
        error: (error as Error).message,
      });
      return { code: 500, message: 'Failed to create account' };
    }
  }

  private static async sendOtpEmail(
    email: string,
    otp: string,
  ): Promise<{ success: boolean } | ServiceError> {
    const sesService = new SESService();
    const emailTemplate = EmailTemplateGenerator.generateOtpTemplate({
      to: email,
      otp,
    });

    const emailResult = await sesService.sendEmail(emailTemplate);

    if ('code' in emailResult) {
      logger.error('OTP_EMAIL_SEND_FAILED', {
        email,
        error: emailResult.message,
      });
      return emailResult;
    }

    logger.info('OTP_EMAIL_SENT', { email, messageId: emailResult.MessageId });
    return { success: true };
  }

  private static async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<{ success: boolean } | ServiceError> {
    const sesService = new SESService();
    const emailTemplate = EmailTemplateGenerator.generatePasswordResetTemplate({
      to: email,
      reset_url: resetUrl,
    });

    const emailResult = await sesService.sendEmail(emailTemplate);

    if ('code' in emailResult) {
      logger.error('PASSWORD_RESET_EMAIL_SEND_FAILED', {
        email,
        error: emailResult.message,
      });
      return emailResult;
    }

    logger.info('PASSWORD_RESET_EMAIL_SENT', {
      email,
      messageId: emailResult.MessageId,
    });
    return { success: true };
  }

  private static transformEmailToDomain(email: string): string | ServiceError {
    const parts = email.split('@');
    if (parts.length !== 2) {
      return { code: 400, message: 'Invalid email format' };
    }

    const domain = parts[1];
    const normalizedDomain = domain.toLowerCase();

    // Check if it's a public domain
    if (PUBLIC_DOMAINS.includes(normalizedDomain)) {
      // Create synthetic domain: replace @ with _
      // user@gmail.com -> user_gmail.com
      return email.replace('@', '_').toLowerCase();
    }

    // Return normal domain for work emails
    return normalizedDomain;
  }

  static isSyntheticDomain(domain: string): boolean {
    if (!domain.includes('_')) {
      return false;
    }

    const parts = domain.split('_');
    const possiblePublicDomain = parts[parts.length - 1];

    return PUBLIC_DOMAINS.includes(possiblePublicDomain.toLowerCase());
  }
}

// ============ Validator Class ============

class AuthValidator {
  static validateEmail(email: string): ServiceError | null {
    if (!email || typeof email !== 'string') {
      return { code: 400, message: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { code: 400, message: 'Invalid email format' };
    }

    return null;
  }

  static validatePassword(password: string): ServiceError | null {
    if (!password || typeof password !== 'string') {
      return { code: 400, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { code: 400, message: 'Password must be at least 8 characters' };
    }

    return null;
  }

  static validateOrganizationId(organization_id: string): ServiceError | null {
    if (!organization_id || typeof organization_id !== 'string') {
      return { code: 400, message: 'organization_id is required' };
    }

    return null;
  }

  static validateRefreshToken(refresh_token: string): ServiceError | null {
    if (!refresh_token || typeof refresh_token !== 'string') {
      return { code: 400, message: 'refresh_token is required' };
    }

    return null;
  }

  static validateEmailAndPassword(
    email: string,
    password: string,
  ): ServiceError | null {
    if (!email || !password) {
      return { code: 400, message: 'email and password are required' };
    }

    const emailValidation = this.validateEmail(email);
    if (emailValidation) {
      return emailValidation;
    }

    const passwordValidation = this.validatePassword(password);
    if (passwordValidation) {
      return passwordValidation;
    }

    return null;
  }

  static validateEmailAndOtp(email: string, otp: string): ServiceError | null {
    if (!email || !otp) {
      return { code: 400, message: 'email and otp are required' };
    }

    const emailValidation = this.validateEmail(email);
    if (emailValidation) {
      return emailValidation;
    }

    return null;
  }

  static async validateOtpForVerification(
    email: string,
    otp: string,
    otpSession: unknown,
  ): Promise<ServiceError | null> {
    if (!otpSession) {
      logger.warn('OTP_SESSION_NOT_FOUND', { email });
      return {
        code: 400,
        message: 'No OTP session found. Please request a new OTP.',
      };
    }

    const session = otpSession as { otp: string; otp_expires_at: Date };

    if (dayjs().isAfter(session.otp_expires_at)) {
      logger.warn('OTP_EXPIRED', { email });
      await OtpSessionRepository.update(
        { email, session_type: OTP_PURPOSE.SIGNUP_OTP },
        { is_used: true },
      );
      return {
        code: 400,
        message: 'OTP has expired. Please request a new OTP.',
      };
    }

    if (session.otp !== otp) {
      logger.warn('OTP_INVALID', { email });
      return { code: 400, message: 'Invalid OTP' };
    }

    return null;
  }

  static validateOtpSession(otpSession: unknown): ServiceError | null {
    if (!otpSession) {
      return {
        code: 400,
        message: 'No OTP session found. Please request a new OTP.',
      };
    }

    return null;
  }

  static validateOtpNotExpired(otpExpiresAt: Date): ServiceError | null {
    if (dayjs().isAfter(otpExpiresAt)) {
      return {
        code: 400,
        message: 'OTP has expired. Please request a new OTP.',
      };
    }

    return null;
  }

  static validateOtpMatch(
    providedOtp: string,
    storedOtp: string,
  ): ServiceError | null {
    if (storedOtp !== providedOtp) {
      return { code: 400, message: 'Invalid OTP' };
    }

    return null;
  }

  static validateEmailPasswordAndOrganizationId(
    email: string,
    password: string,
    organization_id: string,
  ): ServiceError | null {
    if (!email || !password || !organization_id) {
      return {
        code: 400,
        message: 'email, password, and organization_id are required',
      };
    }

    const emailValidation = this.validateEmail(email);
    if (emailValidation) {
      return emailValidation;
    }

    const passwordValidation = this.validatePassword(password);
    if (passwordValidation) {
      return passwordValidation;
    }

    return null;
  }

  static validateTokenAndPassword(
    token: string,
    password: string,
  ): ServiceError | null {
    if (!token || !password) {
      return { code: 400, message: 'token and password are required' };
    }

    if (typeof token !== 'string') {
      return { code: 400, message: 'Reset token is required' };
    }

    const passwordValidation = this.validatePassword(password);
    if (passwordValidation) {
      return passwordValidation;
    }

    return null;
  }

  static async validateResetPasswordToken(
    token: string,
  ): Promise<{ email: string } | ServiceError> {
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.jwt.refreshTokenSecret) as {
        email: string;
      };
    } catch (error) {
      logger.warn('RESET_TOKEN_VERIFICATION_FAILED', {
        error: (error as Error).message,
      });
      return { code: 400, message: 'Invalid or expired reset token' };
    }

    const { email } = decodedToken;

    const user = await OrganizationUserRepository.get({ email });
    if (!user) {
      logger.warn('RESET_PASSWORD_USER_NOT_FOUND', { email });
      return { code: 404, message: 'User not found' };
    }

    return { email };
  }

  // ============ Database Layer Validations ============

  static async validateOrganizationExistsAndActive(
    organization_id: string,
  ): Promise<{ organization: Organization; config_id: string } | ServiceError> {
    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    if (!organization.is_active) {
      logger.warn('ORGANIZATION_INACTIVE', { organization_id });
      return { code: 403, message: 'Organization is not active' };
    }

    if (!organization.organization_config_id) {
      logger.warn('ORGANIZATION_CONFIG_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization configuration not found' };
    }

    return {
      organization,
      config_id: organization.organization_config_id.toString(),
    };
  }

  static async validateUserExistsAndActive(
    email: string,
  ): Promise<{ user: OrganizationUser } | ServiceError> {
    const user = await OrganizationUserRepository.get({ email });

    if (!user) {
      logger.warn('ORGANIZATION_USER_NOT_FOUND', { email });
      return { code: 401, message: 'Invalid email or password' };
    }

    if (!user.is_active) {
      logger.warn('ORGANIZATION_USER_INACTIVE', { email });
      return { code: 403, message: 'User account is not active' };
    }

    return { user };
  }

  static async validateUserExists(
    email: string,
  ): Promise<{ user: OrganizationUser } | ServiceError> {
    const user = await OrganizationUserRepository.get({ email });

    if (!user) {
      logger.warn('USER_NOT_FOUND', { email });
      return {
        code: 404,
        message: 'User with this email does not exist',
      };
    }

    return { user };
  }

  static async validateUserDoesNotExist(
    email: string,
  ): Promise<ServiceError | null> {
    const existingUser = await OrganizationUserRepository.get({ email });

    if (existingUser) {
      logger.warn('USER_ALREADY_EXISTS', { email });
      return { code: 400, message: 'User with this email already exists' };
    }

    return null;
  }

  static async validateOrganizationExists(
    organization_id: string,
  ): Promise<{ organization: Organization } | ServiceError> {
    const organization = await OrganizationRepository.get({
      _id: organization_id,
    });

    if (!organization) {
      logger.warn('ORGANIZATION_NOT_FOUND', { organization_id });
      return { code: 404, message: 'Organization not found' };
    }

    return { organization };
  }

  static async validateDomainNotRegistered(
    domain: string,
  ): Promise<ServiceError | null> {
    const existingOrg = await OrganizationRepository.get({ domain });

    if (existingOrg) {
      logger.warn('DOMAIN_ALREADY_REGISTERED', { domain });
      return {
        code: 400,
        message: 'An admin account already exists for this domain',
      };
    }

    return null;
  }

  static async validateOtpSessionVerified(
    email: string,
  ): Promise<{ session: OtpSession } | ServiceError> {
    const otpSession = await OtpSessionRepository.get({
      email,
      session_type: OTP_PURPOSE.SIGNUP_OTP,
      is_verified: true,
      is_used: false,
    });

    if (!otpSession) {
      logger.warn('OTP_NOT_VERIFIED', { email });
      return {
        code: 400,
        message: 'Email not verified. Please verify OTP first.',
      };
    }

    return { session: otpSession };
  }

  static async validateAdminRoleExists(): Promise<
    { role_id: string } | ServiceError
  > {
    const adminRole = await RoleRepository.get({ name: 'admin' });

    if (!adminRole) {
      logger.error('ADMIN_ROLE_NOT_FOUND');
      return {
        code: 500,
        message:
          "Default 'admin' role not found. Please initialize roles first.",
      };
    }

    return { role_id: (adminRole._id as Types.ObjectId).toString() };
  }
}
