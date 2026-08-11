import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

import { config } from '../../../config';
import logger from '../logger';

const createS3Client = (region: string): S3Client => {
  return new S3Client({
    region: region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
};

export class S3Service {
  static async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    bucket: string,
    region: string,
  ): Promise<{ url: string } | { message: string; code: number }> {
    try {
      const s3Client = createS3Client(region);

      const s3Object = {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: 'inline',
      };

      const s3ResponseData = await s3Client.send(
        new PutObjectCommand(s3Object),
      );

      logger.info('S3_BUFFER_UPLOAD_RESPONSE', {
        data: s3ResponseData,
        bucket,
        key,
      });

      return {
        url: `https://${bucket}/${key}`,
      };
    } catch (error) {
      logger.error('S3_BUFFER_UPLOAD_FAILED', {
        error: (error as Error).message,
        bucket,
        key,
      });
      return { message: 'S3_BUFFER_UPLOAD_FAILED', code: 500 };
    }
  }

  static async uploadOrganizationSlideImage(
    buffer: Buffer,
    organizationId: string,
    projectId: string,
    slideIndex: number,
    contentType: string,
  ): Promise<string | null> {
    const extension = contentType.split('/')[1] || 'png';
    const key = `organization-slides/${organizationId}/${projectId}/slide_${slideIndex}.${extension}`;

    const result = await this.uploadBuffer(
      buffer,
      key,
      contentType,
      config.aws.s3.organizationSlides.bucket,
      config.aws.s3.organizationSlides.region,
    );

    if ('url' in result) {
      return result.url;
    }

    return null;
  }

  static async uploadVoiceClip(
    buffer: Buffer,
    voiceId: string,
    contentType: string,
  ): Promise<string | null> {
    const extension = contentType.split('/')[1] || 'wav';
    const key = `voices/${voiceId}.${extension}`;

    const result = await this.uploadBuffer(
      buffer,
      key,
      contentType,
      config.aws.s3.voices.bucket,
      config.aws.s3.voices.region,
    );

    if ('url' in result) {
      return result.url;
    }

    return null;
  }

  static async getObject(key: string, bucket: string, region: string) {
    try {
      const s3Client = createS3Client(region);

      const s3Object = {
        Bucket: bucket,
        Key: key,
      };

      const s3ResponseData = await s3Client.send(
        new GetObjectCommand(s3Object),
      );

      logger.info('GET_S3_OBJECT_RESPONSE_SUCCESS', { bucket, key });
      return s3ResponseData;
    } catch (error) {
      logger.error('GET_S3_OBJECT_FAILED', {
        error: (error as Error).message,
        bucket,
        key,
      });
      return { message: 'GET_S3_OBJECT_FAILED', code: 500 };
    }
  }

  /**
   * Upload the raw PPTX/PDF source file to S3 for async processing
   */
  static async uploadOrganizationSlidesSource(
    buffer: Buffer,
    organizationId: string,
    projectId: string,
    originalFilename: string,
  ): Promise<{ url: string; key: string } | null> {
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'pptx';
    const key = `organization-slides-source/${organizationId}/${projectId}/source.${extension}`;
    const contentType =
      extension === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    const result = await this.uploadBuffer(
      buffer,
      key,
      contentType,
      config.aws.s3.organizationSlides.bucket,
      config.aws.s3.organizationSlides.region,
    );

    if ('url' in result) {
      return { url: result.url, key };
    }

    return null;
  }

  /**
   * Download a file from S3 as a Buffer
   */
  static async downloadBuffer(
    key: string,
    bucket: string,
    region: string,
  ): Promise<Buffer | null> {
    try {
      const s3Client = createS3Client(region);

      const s3Object = {
        Bucket: bucket,
        Key: key,
      };

      const s3ResponseData = await s3Client.send(
        new GetObjectCommand(s3Object),
      );

      if (!s3ResponseData.Body) {
        logger.error('S3_DOWNLOAD_EMPTY_BODY', { bucket, key });
        return null;
      }

      // Convert the readable stream to a buffer
      const stream = s3ResponseData.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      logger.info('S3_DOWNLOAD_SUCCESS', { bucket, key, size: buffer.length });
      return buffer;
    } catch (error) {
      logger.error('S3_DOWNLOAD_FAILED', {
        error: (error as Error).message,
        bucket,
        key,
      });
      return null;
    }
  }

  /**
   * Delete an object from S3
   */
  static async deleteObject(
    key: string,
    bucket: string,
    region: string,
  ): Promise<boolean> {
    try {
      const s3Client = createS3Client(region);

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      logger.info('S3_DELETE_SUCCESS', { bucket, key });
      return true;
    } catch (error) {
      logger.error('S3_DELETE_FAILED', {
        error: (error as Error).message,
        bucket,
        key,
      });
      return false;
    }
  }
}
