import { config } from '../../config';
import logger from '../utils/logger';
import { HubspotSyncConsumer } from './hubspot_sync.consumer';
import { LivekitSessionAnalyticsConsumer } from './livekit_session_analytics.consumer';
import { PosthogAnalyticsConsumer } from './posthog_analytics.consumer';
import { SlidesConversionConsumer } from './slides_conversion.consumer';

export class Consumer {
  static async mountConsumer(): Promise<void> {
    try {
      if (config.feature_flags.consumers.livekit_session_analytics) {
        LivekitSessionAnalyticsConsumer.start();
        logger.info('LIVEKIT_SESSION_ANALYTICS_CONSUMER_MOUNTED');
      }

      if (config.feature_flags.consumers.posthog_analytics) {
        PosthogAnalyticsConsumer.start();
        logger.info('POSTHOG_ANALYTICS_CONSUMER_MOUNTED');
      }

      if (config.feature_flags.consumers.hubspot_sync) {
        HubspotSyncConsumer.start();
        logger.info('HUBSPOT_SYNC_CONSUMER_MOUNTED');
      }
      if (config.feature_flags.consumers.slides_conversion) {
        SlidesConversionConsumer.start();
        logger.info('SLIDES_CONVERSION_CONSUMER_MOUNTED');
      }
    } catch (error) {
      logger.error('CONSUMERS_MOUNT_ERROR', error);
      process.exit(1);
    }
  }
}

export { HubspotSyncConsumer } from './hubspot_sync.consumer';
export { LivekitSessionAnalyticsConsumer } from './livekit_session_analytics.consumer';
export { PosthogAnalyticsConsumer } from './posthog_analytics.consumer';
export { SlidesConversionConsumer } from './slides_conversion.consumer';
