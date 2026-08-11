import * as mongoose from 'mongoose';
import { config } from '../../../config';
import logger from '../../utils/logger';

const MongoUri: string | undefined = config.database.mongo.uri;

export class Database {
  static async connect(): Promise<void> {
    if (!mongoose.connection?.readyState) {
      if (MongoUri === undefined || MongoUri === '') {
        logger.error('MONGO_URI_NOT_DEFINED');
        throw new Error('Mongo URI is not defined');
      }
      await mongoose.connect(MongoUri);
      logger.info('CONNECTED_TO_MONGO');
    }
  }

  public async disconnect(): Promise<void> {
    if (mongoose.connection?.readyState) {
      await mongoose.disconnect();
    }
    logger.info('DISCONNECTED_FROM_MONGO');
  }
}
