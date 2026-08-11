import nodemailer, { type SendMailOptions } from 'nodemailer';
import SESTransport from 'nodemailer/lib/ses-transport';
import { SESClient } from '@aws-sdk/client-ses';
import * as AWS from '@aws-sdk/client-ses';
import { config } from '../../../config';
import type { ServiceError } from '../../services/types';
import logger from '../logger';

const sesClient = new SESClient({
  region: config.aws.ses.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export type Template = SendMailOptions;

export class SESService {
  public async sendEmail(
    template: Template,
  ): Promise<{ MessageId: string } | ServiceError> {
    try {
      if (template.to === '' || template.to === undefined) {
        return {
          message: 'NO_RECIPIENT',
          code: 400,
        };
      }
      const transporter = nodemailer.createTransport({
        SES: { ses: sesClient, aws: AWS },
      } as SESTransport.Options);
      const sendEmailResponse = await transporter.sendMail(template);
      logger.info('SEND_EMAIL_RESPONSE', {
        messageId: sendEmailResponse.messageId,
      });
      return { MessageId: sendEmailResponse.messageId };
    } catch (error) {
      logger.error('ERROR_SENDING_EMAIL', { error });
      return {
        message: 'ERROR_SENDING_EMAIL',
        code: 500,
      };
    }
  }
}
