import crypto from 'crypto';

import { config } from '../../../config';
import logger from '../logger';

export class EncryptionService {
  private static getEncryptionKey(): Buffer {
    const secretKey = config.encryption.key;

    if (!secretKey) {
      logger.error('ENCRYPTION_KEY_NOT_CONFIGURED');
      throw new Error('ENCRYPTION_KEY environment variable is not configured');
    }

    return crypto.scryptSync(secretKey, 'salt', 32);
  }

  static encrypt(plainText: string): string {
    const encryptionKey = this.getEncryptionKey();
    const initializationVector = crypto.randomBytes(
      config.encryption.initializationVectorLength,
    );

    const cipher = crypto.createCipheriv(
      config.encryption.algorithm,
      encryptionKey,
      initializationVector,
    );

    let encryptedData = cipher.update(plainText, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    const authenticationTag = cipher.getAuthTag();

    const encryptedPayload = `${initializationVector.toString('hex')}:${authenticationTag.toString('hex')}:${encryptedData}`;

    logger.debug('ENCRYPTION_SUCCESSFUL', {
      payload_length: encryptedPayload.length,
    });

    return encryptedPayload;
  }

  static decrypt(encryptedPayload: string): string {
    const encryptionKey = this.getEncryptionKey();
    const payloadParts = encryptedPayload.split(':');

    if (payloadParts.length !== 3) {
      logger.error('DECRYPTION_INVALID_PAYLOAD_FORMAT', {
        parts_count: payloadParts.length,
        expected_parts: 3,
      });
      throw new Error('Invalid encrypted payload format');
    }

    const [ivHex, authTagHex, encryptedData] = payloadParts;

    const initializationVector = Buffer.from(ivHex, 'hex');
    const authenticationTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      config.encryption.algorithm,
      encryptionKey,
      initializationVector,
    );
    decipher.setAuthTag(authenticationTag);

    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    logger.debug('DECRYPTION_SUCCESSFUL');

    return decryptedData;
  }
}
