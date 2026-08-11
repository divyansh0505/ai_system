import { callLLMGateway } from './llm.gateway';
import type { LLMMessage, ServiceError } from './types';
import logger from '../utils/logger';

export class LLMService {
  static async invokeLLM(
    llmMessage: LLMMessage,
  ): Promise<string | ServiceError> {
    logger.debug('LLM_SERVICE_INVOKE', {
      provider: llmMessage.provider,
      model: llmMessage.model_to_use,
    });

    const llmGatewayResponse = await callLLMGateway(llmMessage);

    if (
      typeof llmGatewayResponse === 'object' &&
      'code' in llmGatewayResponse
    ) {
      logger.error('LLM_SERVICE_ERROR', {
        error: llmGatewayResponse,
        provider: llmMessage.provider,
        model: llmMessage.model_to_use,
      });
      return llmGatewayResponse;
    }

    logger.debug('LLM_SERVICE_SUCCESS', {
      provider: llmMessage.provider,
      model: llmMessage.model_to_use,
      responseLength: llmGatewayResponse.length,
    });

    return llmGatewayResponse;
  }
}
