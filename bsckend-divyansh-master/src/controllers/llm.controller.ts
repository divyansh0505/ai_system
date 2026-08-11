import type { Request, Response } from 'express';
import { MuttonResponder } from './mutton.response';
import { LLMService } from '../services/llm.service';
import type { LLMMessage } from '../services/types/llm.types';
import logger from '../utils/logger';

export class LLMController {
  static async invokeLLM(req: Request, res: Response) {
    try {
      const llmData: LLMMessage = req.body;
      const llmResponse = await LLMService.invokeLLM(llmData);
      if (typeof llmResponse === 'object' && 'code' in llmResponse) {
        MuttonResponder.respond(
          res,
          llmResponse.code,
          null,
          llmResponse.message,
        );
        return;
      }
      MuttonResponder.respond(res, 200, { response: llmResponse });
      return;
    } catch (error) {
      logger.error('LLM_INVOKE_ERROR', {
        error,
      });
      MuttonResponder.respond(res, 500, null, 'INTERNAL_SERVER_ERROR');
      return;
    }
  }
}
