import jwt from 'jsonwebtoken';

import { config } from '../../config';
import type {
  AccessTokenPayload,
  DashboardTokenPayload,
  RefreshTokenPayload,
} from './types/auth.types';

export class JWT {
  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(
      token,
      config.jwt.accessTokenSecret,
    ) as AccessTokenPayload;
  }

  static verifyDashboardToken(token: string): DashboardTokenPayload {
    return jwt.verify(
      token,
      config.jwt.accessTokenSecret,
    ) as DashboardTokenPayload;
  }

  static verifyDashboardRefreshToken(
    token: string,
  ): DashboardTokenPayload & { type: string } {
    return jwt.verify(
      token,
      config.jwt.refreshTokenSecret,
    ) as DashboardTokenPayload & { type: string };
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(
      token,
      config.jwt.refreshTokenSecret,
    ) as RefreshTokenPayload;
  }

  static generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.jwt.accessTokenSecret, {
      expiresIn: config.jwt.accessTokenExpiry as jwt.SignOptions['expiresIn'],
    });
  }

  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry as jwt.SignOptions['expiresIn'],
    });
  }
}
