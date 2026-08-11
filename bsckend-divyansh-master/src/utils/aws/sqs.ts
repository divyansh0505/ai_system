import { Producer } from 'sqs-producer';
import { Consumer } from 'sqs-consumer';
import { SQSClient, type Message } from '@aws-sdk/client-sqs';

import { config } from '../../../config';
import logger from '../logger';

interface SqsProducerPayload {
  id: string;
  message: unknown;
}

function createSqsClient(): SQSClient {
  return new SQSClient({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

export class SqsProducer {
  static async send(
    queue: string,
    payload: SqsProducerPayload,
  ): Promise<boolean> {
    try {
      const sqsClient = createSqsClient();

      const producer = Producer.create({
        queueUrl: queue,
        region: config.aws.region,
        sqs: sqsClient,
      });

      await producer.send({
        id: payload.id,
        body: JSON.stringify(payload.message),
      });

      logger.debug('SQS_MESSAGE_SENT', {
        queue_url: queue,
        payload_id: payload.id,
      });

      return true;
    } catch (error) {
      logger.error('SQS_PRODUCER_SEND_ERROR', {
        payload_id: payload.id,
        error_message: (error as Error).message,
      });
      return false;
    }
  }
}

export class SqsConsumer {
  static listen(
    queue: string,
    callback: (message: Record<string, unknown>) => Promise<boolean | Error>,
  ): void {
    const sqsClient = createSqsClient();

    const consumer = Consumer.create({
      queueUrl: queue,
      region: config.aws.region,
      sqs: sqsClient,
      handleMessage: async (message: Message): Promise<Message | undefined> => {
        try {
          await callback(
            JSON.parse(message.Body as string) as Record<string, unknown>,
          );
          return message;
        } catch (error) {
          logger.error('SQS_CONSUMER_HANDLE_MESSAGE_ERROR', {
            queue,
            message: message.Body,
            error_message: (error as Error).message,
          });
          throw error;
        }
      },
    });

    consumer.start();
  }
}
