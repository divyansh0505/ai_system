import type { LLMMessage } from '../types';
import type { ServiceError } from '../types';

export function validateLLMMessage(message: Partial<LLMMessage>): {
  valid: boolean;
  error?: ServiceError;
} {
  const requiredFields: Array<keyof LLMMessage> = [
    'provider',
    'system_prompt',
    'user_input',
    'model_to_use',
  ];

  const missingFields = requiredFields.filter((field) => !message[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 400,
      },
    };
  }

  return { valid: true };
}
