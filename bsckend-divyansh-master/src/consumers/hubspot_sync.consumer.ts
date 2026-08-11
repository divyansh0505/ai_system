import { v4 as uuidv4 } from 'uuid';

import { config } from '../../config';
import { HubspotService } from '../services/hubspot.service';
import { SqsConsumer, SqsProducer } from '../utils/aws/sqs';
import { EncryptionService } from '../utils/encryption';
import logger from '../utils/logger';
import { RateLimiter } from '../utils/rate_limiter';
import type {
  HubspotSyncMessage,
  HubspotSyncMessageData,
} from './types/hubspot_sync.types';

const MAX_RETRY_COUNT = 3;

// 150ms = ~6.6 requests per second, well under HubSpot's 10/sec limit
const rateLimiter = new RateLimiter(150);

export class HubspotSyncConsumer {
  static start(): void {
    logger.info('HUBSPOT_SYNC_CONSUMER_STARTING', {
      queue_url: config.aws.sqs.hubspotSyncQueueUrl,
    });

    SqsConsumer.listen(
      config.aws.sqs.hubspotSyncQueueUrl,
      this.handleMessage.bind(this),
    );

    logger.info('HUBSPOT_SYNC_CONSUMER_STARTED');
  }

  static async handleMessage(
    message: Record<string, unknown>,
  ): Promise<boolean | Error> {
    const syncMessage = message as unknown as HubspotSyncMessage;
    const messageData = syncMessage.data;

    logger.info('HUBSPOT_SYNC_MESSAGE_RECEIVED', {
      organization_id: messageData.organizationId,
      email: messageData.contact?.email,
      retry_count: messageData.retryCount || 0,
    });

    try {
      if (!messageData.contact?.email) {
        logger.warn('HUBSPOT_SYNC_NO_CONTACT', {
          organization_id: messageData.organizationId,
        });
        return true;
      }

      // Check if email should be blocked (free email domains + testing patterns)
      const emailCheck = HubspotService.shouldBlockEmail(messageData.contact.email);
      if (emailCheck.blocked) {
        logger.info('HUBSPOT_SYNC_EMAIL_BLOCKED', {
          organization_id: messageData.organizationId,
          email: messageData.contact.email,
          reason: emailCheck.reason,
        });
        return true;
      }

      // Decrypt access token from message
      if (!messageData.encryptedAccessToken) {
        logger.warn('HUBSPOT_SYNC_SKIPPED_NO_TOKEN', {
          organization_id: messageData.organizationId,
        });
        return true;
      }

      let accessToken: string;
      try {
        accessToken = EncryptionService.decrypt(messageData.encryptedAccessToken);
      } catch {
        logger.error('HUBSPOT_SYNC_TOKEN_DECRYPT_FAILED', {
          organization_id: messageData.organizationId,
        });
        return true;
      }

      // Rate limit before making API call
      await rateLimiter.wait();

      let contactId: string;

      // If form ID is configured, form submission already created the contact
      // Just search for it to get the ID for note creation
      if (messageData.hubspotFormId) {
        const existingContact = await HubspotService.searchContactByEmail(
          accessToken,
          messageData.contact.email,
        );

        if (typeof existingContact === 'object' && existingContact !== null && 'code' in existingContact) {
          logger.error('HUBSPOT_CONTACT_SEARCH_FAILED', {
            organization_id: messageData.organizationId,
            email: messageData.contact.email,
            error_code: existingContact.code,
          });
          await this.sendToDlq(
            messageData.organizationId,
            message,
            `SEARCH_ERROR_${existingContact.code}`,
          );
          return true;
        }

        if (!existingContact) {
          logger.warn('HUBSPOT_CONTACT_NOT_FOUND_AFTER_FORM', {
            organization_id: messageData.organizationId,
            email: messageData.contact.email,
          });
          return true;
        }

        contactId = existingContact.id;
        logger.info('HUBSPOT_CONTACT_FOUND_VIA_FORM', {
          organization_id: messageData.organizationId,
          email: messageData.contact.email,
          contact_id: contactId,
        });
      } else {
        // No form configured - create or update contact via CRM API
        const result = await HubspotService.createOrUpdateContact(
          accessToken,
          messageData.contact.properties,
        );

        // Check for errors
        if (typeof result === 'object' && 'code' in result) {
          // Handle rate limit (429) - re-queue with retry count
          if (result.code === 429) {
            return this.handleRateLimitError(messageData, message);
          }

          // Other errors - log and send to DLQ
          logger.error('HUBSPOT_SYNC_FAILED', {
            organization_id: messageData.organizationId,
            email: messageData.contact.email,
            error_code: result.code,
            error_message: result.message,
          });

          await this.sendToDlq(
            messageData.organizationId,
            message,
            `API_ERROR_${result.code}`,
          );
          return true;
        }

        contactId = result.id;
        logger.info('HUBSPOT_CONTACT_SYNC_SUCCESS', {
          organization_id: messageData.organizationId,
          email: messageData.contact.email,
          contact_id: contactId,
        });
      }

      // Create note with transcript if noteBody is provided
      if (messageData.noteBody) {
        await this.createNoteIfProvided(
          accessToken,
          contactId,
          messageData.noteBody,
          messageData.noteTimestamp,
          messageData.organizationId,
          messageData.contact.email,
        );
      }

      return true;
    } catch (error) {
      logger.error('HUBSPOT_SYNC_PROCESSING_ERROR', {
        organization_id: messageData.organizationId,
        email: messageData.contact?.email,
        error_message: (error as Error).message,
      });

      await this.sendToDlq(
        messageData.organizationId,
        message,
        'PROCESSING_ERROR',
      );

      return error as Error;
    }
  }

  private static async handleRateLimitError(
    messageData: HubspotSyncMessageData,
    originalMessage: unknown,
  ): Promise<boolean> {
    const retryCount = (messageData.retryCount || 0) + 1;

    if (retryCount > MAX_RETRY_COUNT) {
      logger.error('HUBSPOT_SYNC_MAX_RETRIES_EXCEEDED', {
        organization_id: messageData.organizationId,
        email: messageData.contact.email,
        retry_count: retryCount,
      });
      await this.sendToDlq(
        messageData.organizationId,
        originalMessage,
        'MAX_RETRIES_EXCEEDED',
      );
      return true;
    }

    // Re-queue with incremented retry count
    // Add exponential backoff delay via SQS DelaySeconds would be ideal,
    // but for now we'll just re-queue immediately and let rate limiter handle it
    logger.warn('HUBSPOT_SYNC_RATE_LIMITED_REQUEUEING', {
      organization_id: messageData.organizationId,
      email: messageData.contact.email,
      retry_count: retryCount,
    });

    const success = await SqsProducer.send(config.aws.sqs.hubspotSyncQueueUrl, {
      id: uuidv4(),
      message: {
        data: {
          ...messageData,
          retryCount,
        },
      },
    });

    if (!success) {
      logger.error('HUBSPOT_SYNC_REQUEUE_FAILED', {
        organization_id: messageData.organizationId,
        email: messageData.contact.email,
      });
      await this.sendToDlq(
        messageData.organizationId,
        originalMessage,
        'REQUEUE_FAILED',
      );
    }

    return true;
  }

  private static async createNoteIfProvided(
    accessToken: string,
    contactId: string,
    noteBody: string,
    noteTimestamp?: string,
    organizationId?: string,
    contactEmail?: string,
  ): Promise<void> {
    try {
      // Rate limit before making API call
      await rateLimiter.wait();

      const noteResult = await HubspotService.createNote(
        accessToken,
        contactId,
        noteBody,
        noteTimestamp,
      );

      if (typeof noteResult === 'object' && 'code' in noteResult) {
        // Log error but don't fail the overall sync
        logger.error('HUBSPOT_NOTE_CREATION_ERROR', {
          organization_id: organizationId,
          email: contactEmail,
          contact_id: contactId,
          error_code: noteResult.code,
          error_message: noteResult.message,
        });
        return;
      }

      logger.info('HUBSPOT_NOTE_CREATION_COMPLETE', {
        organization_id: organizationId,
        email: contactEmail,
        contact_id: contactId,
        note_id: noteResult.id,
      });
    } catch (error) {
      logger.error('HUBSPOT_NOTE_CREATION_EXCEPTION', {
        organization_id: organizationId,
        email: contactEmail,
        contact_id: contactId,
        error: (error as Error).message,
      });
    }
  }

  private static async sendToDlq(
    id: string,
    message: unknown,
    reason: string,
  ): Promise<void> {
    const dlqPayload = {
      id,
      message: { original: message, dlq_reason: reason },
    };

    const success = await SqsProducer.send(
      config.aws.sqs.hubspotSyncDlqUrl,
      dlqPayload,
    );

    if (success) {
      logger.info('HUBSPOT_SYNC_MESSAGE_SENT_TO_DLQ', { id, reason });
    } else {
      logger.error('HUBSPOT_SYNC_DLQ_SEND_ERROR', { id });
    }
  }
}
