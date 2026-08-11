import type { LLMResponse, LLMMessage } from '../../types';
import type { ServiceError } from '../../types';

export type LlmAdapterResponse = LLMResponse;

export type LlmAdapterParams = Omit<LLMMessage, 'provider'>;

export abstract class BaseLlmAdapter {
  protected provider: string;

  constructor(provider: string) {
    this.provider = provider;
  }

  abstract invokeLlm(
    params: LlmAdapterParams,
  ): Promise<LlmAdapterResponse | ServiceError>;
}
