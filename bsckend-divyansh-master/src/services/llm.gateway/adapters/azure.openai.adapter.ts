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

type AzureOpenAIMessageContent = string | AzureOpenAIContentPart[];

interface AzureOpenAITextContent {
  type: 'text';
  text: string;
}

interface AzureOpenAIImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

type AzureOpenAIContentPart = AzureOpenAITextContent | AzureOpenAIImageContent;

interface AzureOpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: AzureOpenAIMessageContent;
}

interface AzureOpenAIRequest extends Record<string, unknown> {
  messages: AzureOpenAIMessage[];
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
}

interface AzureOpenAIChatCompletion {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

interface AzureOpenAIResponse {
  choices: AzureOpenAIChatCompletion[];
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

interface AzureOpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string | null;
  };
}

interface AzureOpenAIError extends Error {
  response?: {
    status?: number;
    statusText?: string;
    data?: AzureOpenAIErrorResponse;
  };
  code?: string;
}

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class AzureOpenAiAdapter extends BaseLlmAdapter {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiVersion: string;

  constructor() {
    super(LLM_PROVIDER.AZURE_OPENAI);

    this.apiUrl = config.azure_openai.base_url;
    this.apiKey = config.azure_openai.api_key;
    this.apiVersion = config.azure_openai.api_version;
  }

  private async callAzureOpenAIApi<T = unknown>(
    deploymentName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    data?: unknown,
  ): Promise<T | ServiceError> {
    try {
      const url = `${this.apiUrl}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.apiVersion}`;

      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        data,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AzureOpenAIError;
      const errorData = axiosError.response?.data;
      const errorMessage =
        errorData?.error?.message ||
        axiosError.message ||
        'Unknown error occurred';
      const errorType = errorData?.error?.type || 'API_ERROR';
      const statusCode = axiosError.response?.status || 500;

      logger.error('AZURE_OPENAI_API_ERROR', {
        deploymentName,
        method,
        statusCode,
        errorType,
        message: errorMessage,
        code: errorData?.error?.code,
        param: errorData?.error?.param,
      });

      return {
        message: `Azure OpenAI API error (${errorType}): ${errorMessage}`,
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
  ): AzureOpenAIMessageContent {
    if (typeof content === 'string') {
      return content;
    }

    return content.map((part): AzureOpenAIContentPart => {
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
    const systemMessage: AzureOpenAIMessage = {
      role: 'system',
      content: params.system_prompt,
    };

    const userMessages: AzureOpenAIMessage[] = params.user_input.map((msg) => ({
      role: msg.role === Role.USER ? Role.USER : Role.ASSISTANT,
      content: this.convertContent(msg.content),
    }));

    const messages: AzureOpenAIMessage[] = [systemMessage, ...userMessages];

    const requestBody: AzureOpenAIRequest = {
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

    const deploymentName = params.model_to_use;

    const response = await this.callAzureOpenAIApi<AzureOpenAIResponse>(
      deploymentName,
      'POST',
      requestBody,
    );

    if (response && 'code' in response && response.code !== undefined) {
      return response;
    }

    const azureOpenAiResponse = response as AzureOpenAIResponse;

    if (!azureOpenAiResponse.choices?.[0]?.message?.content) {
      const errorMessage = 'Received empty response from Azure OpenAI';
      logger.warn('AZURE_OPENAI_EMPTY_RESPONSE', {
        deploymentName: params.model_to_use,
        response: azureOpenAiResponse,
      });
      return {
        message: errorMessage,
        code: 500,
        details: { error: errorMessage },
      };
    }

    return {
      content: azureOpenAiResponse.choices[0].message.content,
    };
  }
}

export const azureOpenAiAdapter = new AzureOpenAiAdapter();
