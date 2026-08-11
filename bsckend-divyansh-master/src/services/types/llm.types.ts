export enum LLM_PROVIDER {
  AZURE_OPENAI = 'azure_openai',
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export interface LLMTextContent {
  type: 'text';
  text: string;
}

export interface LLMImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export type LLMContentPart = LLMTextContent | LLMImageContent;

export interface LLMUserInput {
  role: string;
  content: string | LLMContentPart[];
}

export interface LLMMessage {
  provider: LLM_PROVIDER;
  system_prompt: string;
  user_input: LLMUserInput[];
  model_to_use: string;
  response_schema?: Record<string, unknown>;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  content: string;
}

export interface SlideAnalysisResult {
  topic: string | null;
  layout_description: string | null;
  content_fields: string[];
}
