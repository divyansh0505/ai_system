import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

import { config } from '../../../config';
import { SessionRepository } from '../../db/mongo/repository/session.repository';
import { UserRepository } from '../../db/mongo/repository/user.repository';
import logger from '../logger';
import {
  prepareAndConvertForSheets,
  SheetDataType,
} from '../../consumers/converters/sheets_data.converter';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export class GoogleSheets {
  private spreadsheetId: string;
  private credentialsDict: Record<string, unknown> | null;
  private auth: GoogleAuth | null = null;
  private accessToken: string | null = null;

  constructor(spreadsheetId?: string) {
    this.spreadsheetId = spreadsheetId || config.google_sheets.spreadsheet_id;
    this.credentialsDict = config.google_sheets.credentials;

    if (!this.credentialsDict) {
      throw new Error(
        'Google Sheets credentials not configured. Set GOOGLE_SHEETS_CREDENTIALS environment variable.',
      );
    }

    if (!this.spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID not configured');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.credentialsDict) {
      throw new Error('Google Sheets credentials not available');
    }

    if (!this.auth) {
      this.auth = new GoogleAuth({
        credentials: this.credentialsDict,
        scopes: SCOPES,
      });
      logger.info('GOOGLE_SHEETS_CREDENTIALS_LOADED', {
        source: 'environment_variables',
      });
    }

    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    this.accessToken = tokenResponse.token || null;

    if (!this.accessToken) {
      throw new Error('Failed to get access token');
    }

    return this.accessToken;
  }

  async appendData(
    data: Record<string, unknown>,
    rangeName: string = 'Sheet1!A1',
  ): Promise<Record<string, unknown>> {
    logger.info('GOOGLE_SHEETS_APPEND_DATA_STARTED', {
      fields_count: Object.keys(data).length,
    });

    const accessToken = await this.getAccessToken();
    const rowValues = Object.values(data);
    const values = [rowValues];

    const url = `${BASE_URL}/${this.spreadsheetId}/values/${rangeName}:append?valueInputOption=USER_ENTERED`;

    const response = await axios.post(
      url,
      { values },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status !== 200) {
      const errorMessage = response.data?.error?.message || response.statusText;
      const errorCode = response.data?.error?.code || response.status;

      logger.error('GOOGLE_SHEETS_API_ERROR', {
        error_code: errorCode,
        error_message: errorMessage,
        status_code: response.status,
      });

      throw new Error(
        `Google Sheets API error (${errorCode}): ${errorMessage}`,
      );
    }

    logger.info('GOOGLE_SHEETS_APPEND_DATA_SUCCESS', {
      updated_range: response.data?.updates?.updatedRange,
    });

    return response.data;
  }

  static async appendSessionToSheets(
    sessionId: string,
    organizationName: SheetDataType,
  ): Promise<void> {
    try {
      const session = await SessionRepository.get({ _id: sessionId });

      if (!session) {
        logger.warn('GOOGLE_SHEETS_SESSION_NOT_FOUND', {
          session_id: sessionId,
        });
        return;
      }

      const user = session.user_id
        ? await UserRepository.get({ _id: session.user_id })
        : null;

      let convertedData: Record<string, unknown>;

      try {
        convertedData = prepareAndConvertForSheets(
          organizationName,
          session,
          user,
        );
      } catch (validationError) {
        logger.warn('GOOGLE_SHEETS_DATA_VALIDATION_ERROR', {
          error_message: (validationError as Error).message,
          session_id: sessionId,
          organization_name: organizationName,
        });
        return;
      }

      if (
        typeof convertedData !== 'object' ||
        convertedData === null ||
        Array.isArray(convertedData)
      ) {
        logger.error('GOOGLE_SHEETS_INVALID_DATA_TYPE', {
          session_id: sessionId,
          expected: 'object',
          actual: typeof convertedData,
        });
        throw new TypeError(
          `convertedData must be an object, got ${typeof convertedData}`,
        );
      }

      const sheets = new GoogleSheets();
      await sheets.appendData(convertedData);
    } catch (sheetsError) {
      logger.error('GOOGLE_SHEETS_APPEND_ERROR', {
        error_message: (sheetsError as Error).message,
        session_id: sessionId,
      });
      throw sheetsError;
    }
  }
}
