import logger from './logger';

interface ImageFetchResult {
  base64: string;
  mimeType: string;
}

export class ImageUtils {
  /**
   * Fetches an image from a URL and converts it to base64
   */
  static async fetchImageAsBase64(
    url: string,
  ): Promise<ImageFetchResult | null> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        logger.error('IMAGE_FETCH_FAILED', {
          url,
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');

      const contentType = response.headers.get('content-type') || 'image/png';

      return {
        base64,
        mimeType: contentType,
      };
    } catch (error) {
      logger.error('IMAGE_FETCH_ERROR', {
        url,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Batch fetch multiple images and convert to base64
   */
  static async fetchImagesAsBase64(
    urls: string[],
  ): Promise<Map<string, ImageFetchResult>> {
    const results = new Map<string, ImageFetchResult>();

    const fetchPromises = urls.map(async (url) => {
      const result = await this.fetchImageAsBase64(url);
      if (result) {
        results.set(url, result);
      }
    });

    await Promise.all(fetchPromises);

    logger.info('IMAGES_FETCHED_AS_BASE64', {
      requested: urls.length,
      successful: results.size,
    });

    return results;
  }
}
