import type { AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import FormData from 'form-data';

import type { ServiceError } from '../../services/types';
import axios from 'axios';
import logger from '../logger';

export class AxiosUtils {
  static async makeCallToApi<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: RawAxiosRequestHeaders,
    data?: unknown,
  ): Promise<ServiceError | T> {
    try {
      const isFormData = data instanceof FormData;

      const request: AxiosRequestConfig = {
        url,
        method,
        headers: isFormData
          ? { ...(data as FormData).getHeaders(), ...headers }
          : headers,
      };

      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        request.data = data;
      }

      const response = await axios.request(request);
      if (response.status >= 400) {
        logger.error('API_CALL_ERROR', {
          url,
          method,
          status: response.status,
          response_data: response.data,
        });
      }
      return response.data;
    } catch (error) {
      logger.error('API_CALL_ERROR', { error });
      if (axios.isAxiosError(error)) {
        logger.error('API_CALL_ERROR', {
          url,
          method,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return {
          code: error.response?.status || 500,
          message:
            error.response?.data?.message ||
            error.message ||
            'Internal Server Error.',
        };
      }

      logger.error('API_CALL_ERROR', { error, url, method });
      return { code: 500, message: 'Internal Server Error.' };
    }
  }
}
