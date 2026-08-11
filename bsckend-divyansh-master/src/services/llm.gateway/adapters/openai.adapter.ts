import axios, { type AxiosResponse } from 'axios';

import { config } from '../../../../config';
import {
  BaseLlmAdapter,
  type LlmAdapterParams,
  type LlmAdapterResponse,
} from './base.adapter';
import logger from '../../../utils/logger';
import { LLM_PROVIDER, type LLMContentPart } from '../../types/llm.types';
import type { ServiceError } from '../../types';

type OpenAIMessageContent = string | OpenAIContentPart[];

interface OpenAITextContent {
  type: 'text';
  text: string;
}

interface OpenAIImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

type OpenAIContentPart = OpenAITextContent | OpenAIImageContent;

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: OpenAIMessageContent;
}

interface OpenAIRequest extends Record<string, unknown> {
  model: string;
  messages: OpenAIMessage[];
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIChatCompletion {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

interface OpenAIResponse {
  choices: OpenAIChatCompletion[];
  created: number;
  id: string;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string | null;
  };
}

interface OpenAIError extends Error {
  response?: {
    status?: number;
    statusText?: string;
    data?: OpenAIErrorResponse;
  };
  code?: string;
}

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class OpenAiAdapter extends BaseLlmAdapter {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    super(LLM_PROVIDER.OPENAI);

    this.apiUrl = config.openai.base_url;
    this.apiKey = config.openai.api_key;
  }

  private async callOpenAIApi<T = unknown>(
    requestBody: OpenAIRequest,
  ): Promise<T | ServiceError> {
    try {
      const url = `${this.apiUrl}/chat/completions`;

      const response: AxiosResponse<T> = await axios({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        data: requestBody,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as OpenAIError;
      const errorData = axiosError.response?.data;
      const errorMessage =
        errorData?.error?.message ||
        axiosError.message ||
        'Unknown error occurred';
      const errorType = errorData?.error?.type || 'API_ERROR';
      const statusCode = axiosError.response?.status || 500;

      logger.error('OPENAI_API_ERROR', {
        model: requestBody.model,
        statusCode,
        errorType,
        message: errorMessage,
        code: errorData?.error?.code,
        param: errorData?.error?.param,
      });

      return {
        message: `OpenAI API error (${errorType}): ${errorMessage}`,
        code: statusCode,
        details: {
          status: statusCode,
          type: errorType,
          code: errorData?.error?.code,
          param: errorData?.error?.param,
        },
      };
    }
  }

  private convertContent(
    content: string | LLMContentPart[],
  ): OpenAIMessageContent {
    if (typeof content === 'string') {
      return content;
    }

    return content.map((part): OpenAIContentPart => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text };
      }
      return {
        type: 'image_url',
        image_url: { url: part.image_url.url },
      };
    });
  }

  async invokeLlm(
    params: LlmAdapterParams,
  ): Promise<LlmAdapterResponse | ServiceError> {
    const systemMessage: OpenAIMessage = {
      role: 'system',
      content: params.system_prompt,
    };

    const userMessages: OpenAIMessage[] = params.user_input.map((msg) => ({
      role: msg.role === Role.USER ? Role.USER : Role.ASSISTANT,
      content: this.convertContent(msg.content),
    }));

    const messages: OpenAIMessage[] = [systemMessage, ...userMessages];

    const requestBody: OpenAIRequest = {
      model: params.model_to_use,
      messages,
    };

    if (params.temperature !== undefined) {
      requestBody.temperature = params.temperature;
    }

    if (params.max_tokens !== undefined) {
      requestBody.max_tokens = params.max_tokens;
    }

    if (params.response_schema === undefined) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await this.callOpenAIApi<OpenAIResponse>(requestBody);

    if (response && 'code' in response && response.code !== undefined) {
      return response;
    }

    const openAiResponse = response as OpenAIResponse;

    if (!openAiResponse.choices?.[0]?.message?.content) {
      const errorMessage = 'Received empty response from OpenAI';
      logger.warn('OPENAI_EMPTY_RESPONSE', {
        model: params.model_to_use,
        response: openAiResponse,
      });
      return {
        message: errorMessage,
        code: 500,
        details: { error: errorMessage },
      };
    }

    return {
      content: openAiResponse.choices[0].message.content,
    };
  }
}

export const openAiAdapter = new OpenAiAdapter();
