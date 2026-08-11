import logger from '../../utils/logger';
import type { PosthogEventProperties } from '../types/session_analytics.types';

export class PosthogToSessionVisitorConverter {
  static convert(
    eventProperties: PosthogEventProperties,
  ): Record<string, unknown> {
    const visitorData: Record<string, unknown> = {
      visitor_ip: eventProperties.$ip,
      visitor_user_agent: eventProperties.$raw_user_agent,
      visitor_city: eventProperties.$geoip_city_name,
      visitor_country: eventProperties.$geoip_country_name,
      visitor_subdivision: eventProperties.$set?.$geoip_region_name || null,
      visitor_latitude: eventProperties.$geoip_latitude,
      visitor_longitude: eventProperties.$geoip_longitude,
      visitor_utm_campaign: eventProperties.utm_campaign,
      visitor_utm_source: eventProperties.utm_source,
      visitor_utm_medium: eventProperties.utm_medium,
      visitor_utm_term: eventProperties.utm_term,
      visitor_current_url: eventProperties.$current_url,
      visitor_gclid: eventProperties.gclid,
      hubspotutk: eventProperties.hubspotutk,
    };

    logger.info('POSTHOG_CONVERTER_VISITOR_DATA', {
      data: visitorData,
    });

    // Remove null/undefined values
    return Object.fromEntries(
      Object.entries(visitorData).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    );
  }
}
