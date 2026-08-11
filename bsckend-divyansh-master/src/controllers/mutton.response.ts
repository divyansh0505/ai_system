import type { Response } from 'express';
import logger from '../utils/logger';

interface Cookie {
  name: string;
  value: string;
  options?: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    domain?: string;
    path?: string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
  };
}

export class MuttonResponder {
  public static respond(
    res: Response,
    statusCode: number,
    data: unknown = null,
    errorMessage: string | null = null,
    cookies?: Cookie[],
  ): void {
    if (!statusCode) {
      logger.error('MUTTON_RESPONDER_ERROR', {
        error: 'STATUS_CODE_NOT_PROVIDED',
      });
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: 'Internal Server Error',
        },
      });
    }

    if (cookies?.length) {
      cookies.forEach((cookie) => {
        res.cookie(cookie.name, cookie.value, cookie.options || {});
      });
    }

    res.status(statusCode).json({
      success: !errorMessage,
      data: data,
      error: {
        message: errorMessage,
      },
    });
  }
}
