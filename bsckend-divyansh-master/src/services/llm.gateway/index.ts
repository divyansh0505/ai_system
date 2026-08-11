import { azureOpenAiAdapter } from './adapters/azure.openai.adapter';
import { openAiAdapter } from './adapters/openai.adapter';
import { geminiAdapter } from './adapters/gemini.adapter';
import type { BaseLlmAdapter } from './adapters/base.adapter';
import { validateLLMMessage } from './validation';
import { type ServiceError, LLM_PROVIDER, type LLMMessage } from '../types';
import logger from '../../utils/logger';

class LlmAdapterFactory {
  private static instance: LlmAdapterFactory;
  private adapters: Map<string, BaseLlmAdapter> = new Map();

  private constructor() {
    this.registerAdapter(LLM_PROVIDER.AZURE_OPENAI, azureOpenAiAdapter);
    this.registerAdapter(LLM_PROVIDER.OPENAI, openAiAdapter);
    this.registerAdapter(LLM_PROVIDER.GEMINI, geminiAdapter);
  }

  public static getInstance(): LlmAdapterFactory {
    if (!LlmAdapterFactory.instance) {
      LlmAdapterFactory.instance = new LlmAdapterFactory();
    }
    return LlmAdapterFactory.instance;
  }

  public registerAdapter(provider: string, adapter: BaseLlmAdapter): void {
    this.adapters.set(provider, adapter);
  }

  public getAdapter(provider: string): BaseLlmAdapter | ServiceError {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      const errorMessage = `No adapter found for provider: ${provider}`;
      logger.error(errorMessage);
      return {
        message: errorMessage,
        code: 400,
        details: { error: 'INVALID_PROVIDER', provider },
      };
    }
    return adapter;
  }
}

export const llmAdapterFactory = LlmAdapterFactory.getInstance();

export async function callLLMGateway(
  llmMessage: LLMMessage,
): Promise<string | ServiceError> {
  const { valid, error } = validateLLMMessage(llmMessage);

  if (!valid && error) {
    logger.error('INVALID_LLM_MESSAGE', { error });
    return error;
  }

  const { provider, ...adapterParams } = llmMessage;
  const adapter = llmAdapterFactory.getAdapter(provider);

  if (typeof adapter === 'object' && 'code' in adapter) {
    logger.error('INVALID_ADAPTER', { error: adapter });
    return adapter;
  }

  const response = await adapter.invokeLlm(adapterParams);

  if (typeof response === 'object' && 'code' in response) {
    logger.error('LLM_SERVICE_ERROR', { error: response });
    return response;
  }

  return response.content;
}

export type { LlmAdapterResponse } from './adapters/base.adapter';
