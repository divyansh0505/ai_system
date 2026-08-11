import { config } from '../../config';
import { OrganizationSlidesRepository } from '../db/mongo/repository';
import { SLIDES_CONVERSION_STATUS } from '../db/mongo/models/types';
import { S3Service } from '../utils/aws/s3';
import { SqsConsumer, SqsProducer } from '../utils/aws/sqs';
import logger from '../utils/logger';
import { OrganizationSlidesConverter } from '../services/converters/organization_slides.converter';
import type {
  SlidesConversionSqsPayload,
} from './types/slides_conversion.types';

interface ConvertedSlide {
  s3_url: string;
  base64: string;
}

interface PresentationConvertResult {
  success: boolean;
  slides: ConvertedSlide[];
  message?: string;
}

export class SlidesConversionConsumer {
  static start(): void {
    logger.info('SLIDES_CONVERSION_CONSUMER_STARTING', {
      queue_url: config.aws.sqs.slidesConversionQueueUrl,
    });

    SqsConsumer.listen(
      config.aws.sqs.slidesConversionQueueUrl,
      this.handleMessage.bind(this),
    );

    logger.info('SLIDES_CONVERSION_CONSUMER_STARTED');
  }

  static async handleMessage(
    message: Record<string, unknown>,
  ): Promise<boolean | Error> {
    const sqsPayload = message as unknown as SlidesConversionSqsPayload;
    const conversionData = sqsPayload.data;

    logger.info('SLIDES_CONVERSION_MESSAGE_RECEIVED', {
      organization_id: conversionData.organization_id,
      project_id: conversionData.project_id,
      slides_id: conversionData.slides_id,
      original_filename: conversionData.original_filename,
    });

    try {
      // Validate required fields
      if (
        !conversionData.slides_id ||
        !conversionData.s3_key ||
        !conversionData.project_id
      ) {
        logger.warn('SLIDES_CONVERSION_MISSING_REQUIRED_FIELDS', { message });
        await this.sendToDlq(
          conversionData.slides_id || 'unknown',
          message,
          'MISSING_REQUIRED_FIELDS',
        );
        return true;
      }

      // Check if slides exist and haven't been processed yet
      const slides = await OrganizationSlidesRepository.get({
        _id: conversionData.slides_id,
      });

      if (!slides) {
        logger.warn('SLIDES_NOT_FOUND_FOR_CONVERSION', {
          slides_id: conversionData.slides_id,
        });
        await this.sendToDlq(
          conversionData.slides_id,
          message,
          'SLIDES_NOT_FOUND',
        );
        return true;
      }

      // Idempotency check: skip if already completed
      if (slides.conversion_status === SLIDES_CONVERSION_STATUS.COMPLETED) {
        logger.info('SLIDES_CONVERSION_ALREADY_COMPLETED', {
          slides_id: conversionData.slides_id,
        });
        return true;
      }

      // Update status to processing
      await OrganizationSlidesRepository.update(
        { _id: conversionData.slides_id },
        { conversion_status: SLIDES_CONVERSION_STATUS.PROCESSING },
      );

      // Download file from S3
      const fileBuffer = await S3Service.downloadBuffer(
        conversionData.s3_key,
        config.aws.s3.organizationSlides.bucket,
        config.aws.s3.organizationSlides.region,
      );

      if (!fileBuffer) {
        logger.error('SLIDES_CONVERSION_S3_DOWNLOAD_FAILED', {
          slides_id: conversionData.slides_id,
          s3_key: conversionData.s3_key,
        });
        await this.markConversionFailed(
          conversionData.slides_id,
          'Failed to download source file from S3',
        );
        await this.sendToDlq(
          conversionData.slides_id,
          message,
          'S3_DOWNLOAD_FAILED',
        );
        return true;
      }

      // Convert PPTX/PDF to images
      const convertResult = await this.convertPptxToImages(
        fileBuffer,
        conversionData.project_id,
        conversionData.original_filename,
      );

      if (!convertResult.success || convertResult.slides.length === 0) {
        logger.error('SLIDES_CONVERSION_DAHI_FAILED', {
          slides_id: conversionData.slides_id,
          message: convertResult.message,
        });
        await this.markConversionFailed(
          conversionData.slides_id,
          convertResult.message || 'Failed to convert slides to images',
        );
        await this.sendToDlq(
          conversionData.slides_id,
          message,
          'DAHI_CONVERSION_FAILED',
        );
        return true;
      }

      // Convert to slide DTOs
      const slideDtos = OrganizationSlidesConverter.toInitialSlideItemDtos(
        convertResult.slides,
      );

      // Update slides with image URLs, thumbnail, and mark as completed
      // Use first slide's image as the thumbnail
      const thumbnail = convertResult.slides[0]?.s3_url || null;

      await OrganizationSlidesRepository.update(
        { _id: conversionData.slides_id },
        {
          slides: slideDtos,
          thumbnail: thumbnail || undefined,
          conversion_status: SLIDES_CONVERSION_STATUS.COMPLETED,
          conversion_error: null,
        },
      );

      // Cleanup: delete source file from S3
      await S3Service.deleteObject(
        conversionData.s3_key,
        config.aws.s3.organizationSlides.bucket,
        config.aws.s3.organizationSlides.region,
      );

      logger.info('SLIDES_CONVERSION_COMPLETED_SUCCESSFULLY', {
        slides_id: conversionData.slides_id,
        project_id: conversionData.project_id,
        slides_count: slideDtos.length,
      });

      return true;
    } catch (error) {
      logger.error('SLIDES_CONVERSION_PROCESSING_ERROR', {
        slides_id: conversionData.slides_id,
        error_message: (error as Error).message,
      });

      await this.markConversionFailed(
        conversionData.slides_id,
        (error as Error).message,
      );

      await this.sendToDlq(
        conversionData.slides_id || 'unknown',
        message,
        'SLIDES_CONVERSION_PROCESSING_ERROR',
      );

      return error as Error;
    }
  }

  private static async convertPptxToImages(
    buffer: Buffer,
    project_id: string,
    originalFilename: string,
  ): Promise<PresentationConvertResult> {
    const formData = new FormData();
    const uint8Array = new Uint8Array(buffer);
    const isPdf = originalFilename.toLowerCase().endsWith('.pdf');
    const filename = isPdf ? 'presentation.pdf' : 'presentation.pptx';
    formData.append('file', new Blob([uint8Array]), filename);
    formData.append('project_id', project_id);

    try {
      const response = await fetch(
        `${config.dahi.baseUrl}/convert/slides-to-image`,
        {
          method: 'POST',
          headers: {
            'X-Dahi-Secret': config.dahi.secret,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SLIDES_CONVERSION_DAHI_API_REQUEST_FAILED', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        return {
          success: false,
          slides: [],
          message: `API request failed with status ${response.status}: ${errorText}`,
        };
      }

      const slides = (await response.json()) as ConvertedSlide[];
      return {
        success: true,
        slides,
      };
    } catch (error) {
      logger.error('SLIDES_CONVERSION_DAHI_API_ERROR', {
        error: (error as Error).message,
      });
      return {
        success: false,
        slides: [],
        message: (error as Error).message,
      };
    }
  }

  private static async markConversionFailed(
    slidesId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await OrganizationSlidesRepository.update(
        { _id: slidesId },
        {
          conversion_status: SLIDES_CONVERSION_STATUS.FAILED,
          conversion_error: errorMessage,
        },
      );
    } catch (error) {
      logger.error('SLIDES_CONVERSION_MARK_FAILED_ERROR', {
        slides_id: slidesId,
        error_message: (error as Error).message,
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
      config.aws.sqs.slidesConversionDlqUrl,
      dlqPayload,
    );

    if (success) {
      logger.info('SLIDES_CONVERSION_MESSAGE_SENT_TO_DLQ', {
        id,
        reason,
      });
    } else {
      logger.error('SLIDES_CONVERSION_DLQ_SEND_ERROR', { id });
    }
  }
}
