import type { Request, Response } from 'express';
import { MuttonResponder } from './mutton.response';
import { config } from '../../config';

export class HealthController {
  static async getHealth(_req: Request, res: Response) {
    MuttonResponder.respond(res, 200, {
      environment: config,
      message: 'Service is up and running',
    });
    return;
  }
}
