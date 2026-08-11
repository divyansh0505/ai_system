import { config } from '../../../../config';
import {
  BaseLlmAdapter,
  type LlmAdapterParams,
  type LlmAdapterResponse,
} from './base.adapter';
import logger from '../../../utils/logger';
import { LLM_PROVIDER } from '../../types/llm.types';
import type { ServiceError } from '../../types';
import { AxiosUtils } from '../../../utils/axios';
import {
  GeminiConverter,
  GeminiRole,
  type GeminiContent,
} from '../../converters/gemini.converter';

// Gemini API request/response types
interface GeminiRequest extends Record<string, unknown> {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
}

export class GeminiAdapter extends BaseLlmAdapter {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    super(LLM_PROVIDER.GEMINI);

    this.apiUrl = config.gemini.base_url;
    this.apiKey = config.gemini.api_key;

    if (!this.apiKey) {
      logger.warn(
        'Gemini API key not found in config. Some features may not work.',
      );
    }
  }

  private async callGeminiApi<T = unknown>(
    model: string,
    data: unknown,
  ): Promise<T | ServiceError> {
    const url = `${this.apiUrl}/${model}:generateContent?key=${this.apiKey}`;

    const response = await AxiosUtils.makeCallToApi<T>(
      url,
      'POST',
      { 'Content-Type': 'application/json' },
      data,
    );

    if (response && typeof response === 'object' && 'code' in response) {
      const serviceError = response as ServiceError;
      logger.error('GEMINI_API_ERROR', {
        model,
        statusCode: serviceError.code,
        message: serviceError.message,
      });
    }

    return response;
  }

  async invokeLlm(
    params: LlmAdapterParams,
  ): Promise<LlmAdapterResponse | ServiceError> {
    const contents = GeminiConverter.toGeminiContents(
      params.system_prompt,
      params.user_input,
    );

    logger.debug('GEMINI_REQUEST', {
      model: params.model_to_use,
      messageCount: contents.length,
      hasSystemPrompt: params.system_prompt.length > 0,
    });

    const requestBody: GeminiRequest = {
      contents,
    };

    // Add generation config if needed
    if (params.temperature !== undefined || params.max_tokens !== undefined) {
      requestBody.generationConfig = {
        ...(params.temperature !== undefined && {
          temperature: params.temperature,
        }),
        ...(params.max_tokens !== undefined && {
          maxOutputTokens: params.max_tokens,
        }),
      };
    }

    const response = await this.callGeminiApi<GeminiResponse>(
      params.model_to_use,
      requestBody,
    );

    if (response && 'code' in response && response.code !== undefined) {
      return response as ServiceError;
    }

    const geminiResponse = response as GeminiResponse;

    const finishReason = geminiResponse.candidates?.[0]?.finishReason;

    if (!geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      let errorMessage = 'Received empty or invalid response from Gemini';

      if (finishReason === 'MAX_TOKENS') {
        errorMessage =
          'Gemini response truncated due to max_tokens limit. Increase max_tokens in request.';
        logger.error('GEMINI_MAX_TOKENS_EXCEEDED', {
          model: params.model_to_use,
          finish_reason: finishReason,
        });
      } else {
        logger.warn('GEMINI_EMPTY_RESPONSE', {
          model: params.model_to_use,
          finish_reason: finishReason,
          response: geminiResponse,
        });
      }

      return {
        message: errorMessage,
        code: 500,
        details: { error: errorMessage, finish_reason: finishReason },
      } as ServiceError;
    }

    return {
      content: geminiResponse.candidates[0].content.parts[0].text,
    };
  }
}

export const geminiAdapter = new GeminiAdapter();

// Re-export types and enums for external use
export { GeminiRole, GeminiConverter };
