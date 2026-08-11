import type { LLMContentPart } from '../types/llm.types';
import logger from '../../utils/logger';

/**
 * Enum for Gemini content types
 */
export enum GeminiContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

/**
 * Enum for Gemini message roles
 */
export enum GeminiRole {
  USER = 'user',
  MODEL = 'model',
}

/**
 * Gemini text content part
 */
export interface GeminiTextPart {
  type: GeminiContentType.TEXT;
  data: {
    text: string;
  };
}

/**
 * Gemini image content part (base64 inline data)
 */
export interface GeminiImagePart {
  type: GeminiContentType.IMAGE;
  data: {
    mimeType: string;
    base64: string;
  };
}

export type GeminiPart = GeminiTextPart | GeminiImagePart;

/**
 * Gemini API text part format
 */
interface GeminiApiTextPart {
  text: string;
}

/**
 * Gemini API inline data part format
 */
interface GeminiApiInlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export type GeminiApiPart = GeminiApiTextPart | GeminiApiInlineDataPart;

/**
 * Gemini message content structure
 */
export interface GeminiContent {
  role: GeminiRole;
  parts: GeminiApiPart[];
}

/**
 * Converter class for transforming LLM content to Gemini API format
 */
export class GeminiConverter {
  /**
   * Converts a single LLM content part to internal Gemini part format
   */
  static toGeminiPart(part: LLMContentPart): GeminiPart {
    if (part.type === 'text') {
      return {
        type: GeminiContentType.TEXT,
        data: { text: part.text },
      };
    }

    // Handle image_url type
    const url = part.image_url.url;

    if (url.startsWith('data:')) {
      const parsed = this.parseDataUrl(url);
      if (parsed) {
        return {
          type: GeminiContentType.IMAGE,
          data: {
            mimeType: parsed.mimeType,
            base64: parsed.base64,
          },
        };
      }
    }

    // Fallback for unsupported URL format
    logger.warn('GEMINI_CONVERTER_UNSUPPORTED_URL', {
      message: 'Regular image URLs not supported, use base64 data URLs',
    });

    return {
      type: GeminiContentType.TEXT,
      data: { text: `[Image: ${url}]` },
    };
  }

  /**
   * Converts internal Gemini part to Gemini API format
   */
  static toGeminiApiPart(part: GeminiPart): GeminiApiPart {
    if (part.type === GeminiContentType.TEXT) {
      return { text: part.data.text };
    }

    return {
      inlineData: {
        mimeType: part.data.mimeType,
        data: part.data.base64,
      },
    };
  }

  /**
   * Converts string or LLMContentPart[] to Gemini API parts
   */
  static toGeminiApiParts(content: string | LLMContentPart[]): GeminiApiPart[] {
    if (typeof content === 'string') {
      return [{ text: content }];
    }

    return content.map((part) => {
      const geminiPart = this.toGeminiPart(part);
      return this.toGeminiApiPart(geminiPart);
    });
  }

  /**
   * Converts user input messages to Gemini content format
   */
  static toGeminiContents(
    systemPrompt: string,
    userInput: Array<{ role: string; content: string | LLMContentPart[] }>,
  ): GeminiContent[] {
    const contents: GeminiContent[] = [];

    // Add system prompt as user message with model acknowledgment
    if (systemPrompt) {
      contents.push({
        role: GeminiRole.USER,
        parts: [{ text: systemPrompt }],
      });
      contents.push({
        role: GeminiRole.MODEL,
        parts: [{ text: 'Understood.' }],
      });
    }

    // Convert user input messages
    for (const msg of userInput) {
      contents.push({
        role: msg.role === 'user' ? GeminiRole.USER : GeminiRole.MODEL,
        parts: this.toGeminiApiParts(msg.content),
      });
    }

    return contents;
  }

  /**
   * Parses a data URL to extract mime type and base64 data
   */
  private static parseDataUrl(
    url: string,
  ): { mimeType: string; base64: string } | null {
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches[1] && matches[2]) {
      return {
        mimeType: matches[1],
        base64: matches[2],
      };
    }
    return null;
  }
}
