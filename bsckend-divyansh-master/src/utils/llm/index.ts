import OpenAI, { AzureOpenAI } from 'openai';

import { config, PROMPT_CONFIG } from '../../../config';
import logger from '../logger';
import { LLM_PROVIDER } from '../../services/types/llm.types';

export interface QnaPair {
  question: string;
  answer: string;
  type: 'qna' | 'interaction';
  confidence?: 'low' | 'medium' | 'high' | null;
}

export interface TranscriptAnalysisResult {
  summary: string | null;
  is_icp: boolean | string | null;
  qna_pairs: QnaPair[];
}

let azureOpenaiClient: AzureOpenAI | null = null;
let openaiClient: OpenAI | null = null;

function getAzureOpenAIClient(): AzureOpenAI {
  if (azureOpenaiClient) {
    return azureOpenaiClient;
  }

  const baseUrl = config.azure_openai.base_url;
  const apiKey = config.azure_openai.api_key;
  const apiVersion = config.azure_openai.api_version;

  if (!baseUrl) {
    throw new Error('AZURE_OPENAI_BASE_URL environment variable is required');
  }

  if (!apiKey) {
    throw new Error('AZURE_OPENAI_API_KEY environment variable is required');
  }

  azureOpenaiClient = new AzureOpenAI({
    apiKey: apiKey,
    apiVersion: apiVersion,
    endpoint: baseUrl,
  });

  logger.info('LLM_CLIENT_INITIALIZED', {
    provider: 'azure_openai',
    endpoint: baseUrl,
  });

  return azureOpenaiClient;
}

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = config.openai.api_key;
  const baseUrl = config.openai.base_url;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  openaiClient = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  });

  logger.info('LLM_CLIENT_INITIALIZED', {
    provider: 'openai',
    baseUrl: baseUrl,
  });

  return openaiClient;
}

export interface ModelConfig {
  model: string;
  provider: LLM_PROVIDER;
  max_tokens?: number;
  temperature?: number;
}

export function getLLMClient(
  provider: LLM_PROVIDER = LLM_PROVIDER.AZURE_OPENAI,
): OpenAI | AzureOpenAI {
  if (provider === LLM_PROVIDER.OPENAI) {
    return getOpenAIClient();
  }

  return getAzureOpenAIClient();
}

export function getLLMClientFromConfig(
  modelConfig: ModelConfig,
): OpenAI | AzureOpenAI {
  return getLLMClient(modelConfig.provider);
}

export function getDefaultModel(
  provider: LLM_PROVIDER = LLM_PROVIDER.AZURE_OPENAI,
): string {
  if (provider === LLM_PROVIDER.OPENAI) {
    return config.openai.model;
  }

  return config.azure_openai.model;
}

export async function analyzeTranscript(
  transcripts: Array<{ role: string; content: string }>,
  userData: Record<string, unknown> | null = null,
): Promise<TranscriptAnalysisResult> {
  const emptyResult: TranscriptAnalysisResult = {
    summary: null,
    is_icp: 'NA',
    qna_pairs: [],
  };

  if (!transcripts || transcripts.length === 0) {
    logger.warn('TRANSCRIPT_ANALYSIS_EMPTY_INPUT');
    return emptyResult;
  }

  const formattedTranscript = transcripts
    .map((t) => `${(t.role || 'unknown').toUpperCase()}: ${t.content || ''}`)
    .join('\n');

  if (!formattedTranscript.trim()) {
    logger.warn('TRANSCRIPT_ANALYSIS_NO_CONTENT');
    return emptyResult;
  }

  const promptConfig = PROMPT_CONFIG.TRANSCRIPT_ANALYSIS;
  const modelConfig = promptConfig.MODEL_CONFIG;

  try {
    const client = getLLMClientFromConfig(modelConfig);

    const prompt = promptConfig.USER_PROMPT.replace(
      '{user_data}',
      userData ? JSON.stringify(userData, null, 2) : 'NA',
    ).replace('{transcript}', formattedTranscript);

    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('TRANSCRIPT_ANALYSIS_EMPTY_RESPONSE');
      return emptyResult;
    }

    const result = JSON.parse(content) as TranscriptAnalysisResult;

    if (result.is_icp !== true && result.is_icp !== false) {
      result.is_icp = 'NA';
    }

    if (!result.qna_pairs) {
      result.qna_pairs = [];
    }

    logger.info('TRANSCRIPT_ANALYSIS_COMPLETED', {
      model: modelConfig.model,
      provider: modelConfig.provider,
      transcriptEntries: transcripts.length,
      hasUserData: userData !== null,
      isIcp: result.is_icp,
      summaryLength: result.summary?.length || 0,
      qnaPairsCount: result.qna_pairs.length,
    });

    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.warn('TRANSCRIPT_ANALYSIS_JSON_PARSE_FAILED', {
        errorMessage: error.message,
      });
      return emptyResult;
    }

    logger.error('TRANSCRIPT_ANALYSIS_ERROR', {
      errorMessage: (error as Error).message,
      transcriptCount: transcripts.length,
    });
    return emptyResult;
  }
}
