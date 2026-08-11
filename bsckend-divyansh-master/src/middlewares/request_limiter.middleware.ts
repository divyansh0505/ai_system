import type { Request, Response, NextFunction } from 'express';
import requestIp from 'request-ip';
import dayjs from 'dayjs';

import { config, ServerEnvironment } from '../../config';
import { RequestLimiterRepository } from '../db/mongo/repository';
import { MuttonResponder } from '../controllers/mutton.response';
import logger from '../utils/logger';

export class RequestLimiterMiddleware {
  private static readonly MAX_REQUESTS_PER_MINUTE = 1;
  private static readonly MAX_REQUESTS_PER_DAY = 5;
  private static readonly RATE_LIMIT_INTERVAL_SECONDS = 60;

  static async verify(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (config.env !== ServerEnvironment.PRODUCTION) {
      logger.debug('RATE_LIMIT_BYPASSED_NON_PRODUCTION');
      next();
      return;
    }

    const { email } = req.body;

    if (!email) {
      MuttonResponder.respond(res, 400, null, 'email is required');
      return;
    }

    const ip = requestIp?.getClientIp(req) || '';
    const oneMinuteAgo = dayjs()
      .subtract(this.RATE_LIMIT_INTERVAL_SECONDS, 'seconds')
      .toDate();
    const twentyFourHoursAgo = dayjs().subtract(24, 'hours').toDate();

    const recentRequests = await RequestLimiterRepository.getMany({
      $or: [{ ip }, { email }],
      created_at: { $gte: oneMinuteAgo },
    });

    if (recentRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      logger.warn('RATE_LIMIT_EXCEEDED_INTERVAL', { email, ip });
      MuttonResponder.respond(
        res,
        429,
        null,
        'Too many requests, please try again later.',
      );
      return;
    }

    const dailyRequests = await RequestLimiterRepository.getMany({
      $or: [{ ip }, { email }],
      created_at: { $gte: twentyFourHoursAgo },
    });

    if (dailyRequests.length >= this.MAX_REQUESTS_PER_DAY) {
      logger.warn('RATE_LIMIT_EXCEEDED_DAILY', {
        email,
        ip,
        count: dailyRequests.length,
      });
      MuttonResponder.respond(
        res,
        429,
        null,
        'Daily request limit exceeded. Please try again tomorrow.',
      );
      return;
    }

    await RequestLimiterRepository.create({ email, ip });
    logger.debug('RATE_LIMIT_RECORD_CREATED', { email, ip });

    next();
  }
}
