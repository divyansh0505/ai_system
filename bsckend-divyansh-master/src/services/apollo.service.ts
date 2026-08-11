import { config } from '../../config';
import { AxiosUtils } from '../utils/axios';
import logger from '../utils/logger';
import { ApolloConverter } from './converters/apollo.converter';
import type { ApolloEnrichResponse } from './types/user_enrichment.types';

interface ApolloApiResponse {
  person?: Record<string, unknown>;
}

export class ApolloService {
  static async enrichUserData(email: string): Promise<ApolloEnrichResponse> {
    if (!config.apollo.apiKey) {
      logger.warn('APOLLO_API_KEY_NOT_CONFIGURED', { email });
      return {
        person: null,
        error: 'Apollo API key not configured',
        status_code: 500,
      };
    }

    const url = `${config.apollo.apiUrl}/people/match`;
    const params = {
      email: email,
      reveal_personal_emails: 'true',
      reveal_phone_number: 'false',
    };

    logger.info('APOLLO_ENRICHMENT_REQUEST', { email, url });

    const response = await AxiosUtils.makeCallToApi<ApolloApiResponse>(
      url,
      'POST',
      {
        'Content-Type': 'application/json',
        'x-api-key': config.apollo.apiKey,
      },
      params,
    );

    if (typeof response === 'object' && 'code' in response) {
      logger.error('APOLLO_ENRICHMENT_API_ERROR', {
        email,
        status_code: response.code,
        message: response.message,
      });
      return {
        person: null,
        error: `Apollo API error: ${response.code}`,
        status_code: response.code,
      };
    }

    const person_data = response.person;

    if (!person_data) {
      logger.info('APOLLO_ENRICHMENT_NO_PERSON_DATA', { email });
      return { person: null };
    }

    const person = ApolloConverter.toApolloPersonDataDto(person_data);

    logger.info('APOLLO_ENRICHMENT_SUCCESS', {
      email,
      person_id: person.id,
      has_linkedin: person.linkedin_url !== undefined,
      has_organization: person.organization !== undefined,
    });

    return { person };
  }
}
