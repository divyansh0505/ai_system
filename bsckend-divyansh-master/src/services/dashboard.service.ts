import type { FilterQuery, Types } from 'mongoose';

import {
  SessionRepository,
  UserRepository,
  OrganizationProjectRepository,
  OrganizationSlidesRepository,
} from '../db/mongo/repository';
import type { Session, User } from '../db/mongo/models/types';
import logger from '../utils/logger';
import type { ServiceError } from './types';
import {
  MONTH_NAMES,
  type StatsResponse,
  type SessionsListResponse,
  type SessionDataDto,
  type TranscriptItemDto,
  type VisitorDataRequest,
  type VisitorDataResponse,
  type VisitorsMetricsDto,
  type VisitorsTableDataDto,
  type VisitorTableRowDto,
  type VisitorInfoDto,
  type SessionDetailResponse,
  type IntentLevel as IntentLevelType,
  type ProjectSessionsRequest,
  type ProjectSessionsResponse,
  type ProjectSessionsMetricsDto,
  type ChartDataPointDto,
  type ProjectVisitorRowDto,
} from './types/dashboard.types';
import { SessionDetailConverter } from './converters/session_detail.converter';

export class DashboardService {
  static async getStats(
    current_period_start: Date,
    current_period_end: Date,
    previous_period_start: Date,
    previous_period_end: Date,
    organization_id: string,
    region?: string,
  ): Promise<StatsResponse | ServiceError> {
    logger.debug('CALCULATING_DASHBOARD_STATS', {
      current_period: `${current_period_start} to ${current_period_end}`,
      previous_period: `${previous_period_start} to ${previous_period_end}`,
      region,
      organization_id,
    });

    const current_filter = this.buildFilter(
      organization_id,
      current_period_start,
      current_period_end,
      region,
    );
    const previous_filter = this.buildFilter(
      organization_id,
      previous_period_start,
      previous_period_end,
      region,
    );

    const current_session_count = await SessionRepository.count(current_filter);
    const previous_session_count =
      await SessionRepository.count(previous_filter);
    const session_change = this.calculatePercentageChange(
      current_session_count,
      previous_session_count,
    );

    const current_interactions =
      await this.getTotalInteractions(current_filter);
    const previous_interactions =
      await this.getTotalInteractions(previous_filter);
    const interactions_change = this.calculatePercentageChange(
      current_interactions,
      previous_interactions,
    );

    const current_average_duration =
      await this.getAverageDuration(current_filter);
    const previous_average_duration =
      await this.getAverageDuration(previous_filter);
    const duration_change = this.calculatePercentageChange(
      current_average_duration,
      previous_average_duration,
    );

    const current_active_time = await this.getTotalActiveTime(current_filter);
    const previous_active_time = await this.getTotalActiveTime(previous_filter);
    const active_time_change = this.calculatePercentageChange(
      current_active_time,
      previous_active_time,
    );

    logger.info('DASHBOARD_STATS_CALCULATED', {
      current_session_count,
      current_interactions,
      current_average_duration,
      current_active_time,
    });

    return {
      sessions: {
        current_period: current_session_count,
        change: Math.round(session_change * 100) / 100,
      },
      total_pages_visited: {
        current: current_interactions,
        change: Math.round(interactions_change * 100) / 100,
      },
      average_session_duration: {
        current: current_average_duration,
        change: Math.round(duration_change * 100) / 100,
      },
      active_time_spent: {
        current: current_active_time,
        change: Math.round(active_time_change * 100) / 100,
      },
    };
  }

  static async getSessionsList(
    start_date: Date,
    end_date: Date,
    organization_id: string,
    region?: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<SessionsListResponse | ServiceError> {
    logger.debug('FETCHING_SESSIONS_LIST', {
      period: `${start_date} to ${end_date}`,
      region,
      limit,
      offset,
      organization_id,
    });

    const filter = this.buildFilter(
      organization_id,
      start_date,
      end_date,
      region,
    );

    const total = await SessionRepository.count(filter);
    const sessions = await SessionRepository.getMany(filter, {
      limit,
      offset,
      sortField: 'created_at',
      sortOrder: -1,
    });

    const session_list: SessionDataDto[] = [];

    for (const session of sessions) {
      let user_email: string | null = null;

      if (session.user_id) {
        const user = await UserRepository.get({
          _id: session.user_id,
        });
        if (user?.email) {
          user_email = user.email;
        }
      }

      let transcripts: TranscriptItemDto[] | null = null;
      if (session.transcript && session.transcript.length > 0) {
        transcripts = session.transcript.map((t) => ({
          message: t.message || '',
          timestamp: t.timestamp || '',
          message_by: t.message_by || 'UNKNOWN',
        }));
      }

      session_list.push({
        session_id: (session._id as Types.ObjectId).toString(),
        date: session.created_at,
        email: user_email,
        session_time: session.duration || 0,
        country: session.visitor_country || null,
        city: session.visitor_city || null,
        voice_recording_link: session.voice_recording || null,
        transcripts,
      });
    }

    const has_more = offset + limit < total;

    logger.info('SESSIONS_LIST_FETCHED', {
      total,
      returned: session_list.length,
      has_more,
    });

    return {
      data: session_list,
      total,
      limit,
      offset,
      has_more,
    };
  }

  static async getVisitorData(
    request: VisitorDataRequest,
    organization_id: string,
  ): Promise<VisitorDataResponse | ServiceError> {
    logger.debug('FETCHING_VISITOR_DATA', {
      organization_id,
      current_period: `${request.current_period_start_date} to ${request.current_period_end_date}`,
      country: request.country,
      source: request.source,
      search: request.search,
    });

    const current_filter = this.buildFilter(
      organization_id,
      request.current_period_start_date,
      request.current_period_end_date,
      request.country,
      request.source,
    );

    const previous_filter = this.buildFilter(
      organization_id,
      request.previous_period_start_date,
      request.previous_period_end_date,
      request.country,
      request.source,
    );

    const searchTerm = request.search;

    const metrics = await this.calculateVisitorMetrics(
      current_filter,
      previous_filter,
      searchTerm,
    );

    const table = await this.fetchVisitorTable(
      current_filter,
      searchTerm,
      request.limit || 10,
      request.offset || 0,
    );

    return {
      data: {
        metrics,
        table,
      },
    };
  }

  static async getSessionDetail(
    session_id: string,
    organization_id: string,
  ): Promise<SessionDetailResponse | ServiceError> {
    logger.debug('FETCHING_SESSION_DETAIL', { session_id, organization_id });

    const session = await SessionRepository.get({ _id: session_id });

    if (!session) {
      logger.error('SESSION_NOT_FOUND', { session_id });
      return { code: 404, message: 'Session not found' };
    }

    const sessionOrganizationId = session.organization_id?.toString();
    if (sessionOrganizationId !== organization_id) {
      logger.error('SESSION_ORGANIZATION_MISMATCH', {
        session_id,
        expected: organization_id,
        actual: sessionOrganizationId,
      });
      return {
        code: 403,
        message: 'Session does not belong to this organization',
      };
    }

    const user = session.user_id
      ? await UserRepository.get({ _id: session.user_id })
      : null;

    logger.info('SESSION_DETAIL_FETCHED', { session_id });

    return {
      data: SessionDetailConverter.convert(session, user),
    };
  }

  static async getProjectSessions(
    project_id: string,
    organization_id: string,
    request: ProjectSessionsRequest,
  ): Promise<ProjectSessionsResponse | ServiceError> {
    logger.debug('FETCHING_PROJECT_SESSIONS', {
      project_id,
      organization_id,
      period:
        request.start_date && request.end_date
          ? `${request.start_date} to ${request.end_date}`
          : 'all time',
      country: request.country,
      company: request.company,
    });

    const start_date = request.start_date
      ? new Date(request.start_date)
      : undefined;
    const end_date = request.end_date ? new Date(request.end_date) : undefined;

    const filter = this.buildProjectFilter(
      project_id,
      organization_id,
      start_date,
      end_date,
      request.country,
    );

    const [metricsResult, chartResult, visitorsResult] =
      await Promise.allSettled([
        this.calculateProjectMetrics(filter, request.company),
        this.generateChartData(filter, start_date, end_date),
        this.fetchProjectVisitors(
          filter,
          request.company,
          request.limit || 10,
          request.offset || 0,
        ),
      ]);

    const defaultMetrics: ProjectSessionsMetricsDto = {
      total_visitors: 0,
      avg_duration: { minutes: 0, seconds: 0 },
      total_queries_asked: {
        total: 0,
        voice_percentage: 0,
        chat_percentage: 0,
      },
    };

    const defaultVisitors = {
      rows: [] as ProjectVisitorRowDto[],
      total: 0,
      limit: request.limit || 10,
      offset: request.offset || 0,
      has_more: false,
    };

    const metrics = this.extractSettledValue(
      metricsResult,
      defaultMetrics,
      'CALCULATE_PROJECT_METRICS_FAILED',
    );
    const chart = this.extractSettledValue(
      chartResult,
      [] as ChartDataPointDto[],
      'GENERATE_CHART_DATA_FAILED',
    );
    const visitors = this.extractSettledValue(
      visitorsResult,
      defaultVisitors,
      'FETCH_PROJECT_VISITORS_FAILED',
    );

    logger.info('PROJECT_SESSIONS_FETCHED', {
      project_id,
      total_visitors: metrics.total_visitors,
    });

    return {
      metrics,
      chart,
      visitors,
    };
  }

  private static buildProjectFilter(
    project_id: string,
    organization_id: string,
    start_date?: Date,
    end_date?: Date,
    country?: string,
  ): FilterQuery<Session> {
    const filter: FilterQuery<Session> = {
      organization_project_id: project_id,
      organization_id: organization_id,
    };

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) {
        filter.created_at.$gte = start_date;
      }
      if (end_date) {
        filter.created_at.$lte = end_date;
      }
    }

    if (country) {
      filter.visitor_country = country;
    }

    return filter;
  }

  private static async calculateProjectMetrics(
    filter: FilterQuery<Session>,
    company_filter?: string,
  ): Promise<ProjectSessionsMetricsDto> {
    const sessions = await SessionRepository.getMany(filter);

    let total_visitors = 0;
    let total_duration = 0;
    let duration_count = 0;
    let total_voice = 0;
    let total_chat = 0;

    for (const session of sessions) {
      let include_session = true;

      if (company_filter && session.user_id) {
        const user = await UserRepository.get({ _id: session.user_id });
        const company = user?.company_name || '';
        if (!company.toLowerCase().includes(company_filter.toLowerCase())) {
          include_session = false;
        }
      } else if (company_filter && !session.user_id) {
        include_session = false;
      }

      if (include_session) {
        total_visitors++;

        if (session.duration !== undefined && session.duration !== null) {
          total_duration += session.duration;
          duration_count++;
        }

        total_voice += session.total_voice_interactions || 0;
        total_chat += session.total_chat_interactions || 0;
      }
    }

    const avg_duration_seconds =
      duration_count > 0 ? total_duration / duration_count : 0;
    const total_queries = total_voice + total_chat;
    const voice_percentage =
      total_queries > 0 ? Math.round((total_voice / total_queries) * 100) : 0;
    const chat_percentage =
      total_queries > 0 ? Math.round((total_chat / total_queries) * 100) : 0;

    return {
      total_visitors,
      avg_duration: {
        minutes: Math.floor(avg_duration_seconds / 60),
        seconds: Math.round(avg_duration_seconds % 60),
      },
      total_queries_asked: {
        total: total_queries,
        voice_percentage,
        chat_percentage,
      },
    };
  }

  private static async generateChartData(
    filter: FilterQuery<Session>,
    start_date?: Date,
    end_date?: Date,
  ): Promise<ChartDataPointDto[]> {
    const sessions = await SessionRepository.getMany(filter, {
      sortField: 'created_at',
      sortOrder: 1,
    });

    if (sessions.length === 0) {
      return [];
    }

    // Determine date range from data if not provided
    let effective_start_date = start_date;
    let effective_end_date = end_date;

    if (!effective_start_date || !effective_end_date) {
      const session_dates = sessions.map((s) => new Date(s.created_at));
      effective_start_date =
        effective_start_date ||
        new Date(Math.min(...session_dates.map((d) => d.getTime())));
      effective_end_date =
        effective_end_date ||
        new Date(Math.max(...session_dates.map((d) => d.getTime())));
    }

    const monthly_counts: Map<string, number> = new Map();

    // Initialize all months in the range with 0
    const current = new Date(effective_start_date);
    current.setDate(1); // Start from the first of the month
    while (current <= effective_end_date) {
      const key = `${current.getFullYear()}-${String(current.getMonth()).padStart(2, '0')}`;
      monthly_counts.set(key, 0);
      current.setMonth(current.getMonth() + 1);
    }

    // Count sessions per month
    for (const session of sessions) {
      const session_date = new Date(session.created_at);
      const key = `${session_date.getFullYear()}-${String(session_date.getMonth()).padStart(2, '0')}`;
      if (monthly_counts.has(key)) {
        monthly_counts.set(key, (monthly_counts.get(key) || 0) + 1);
      }
    }

    // Convert to array and sort by date
    const sorted_keys = Array.from(monthly_counts.keys()).sort();
    const chart_data: ChartDataPointDto[] = sorted_keys.map((key) => {
      const month_index = parseInt(key.split('-')[1]);
      return {
        date: MONTH_NAMES[month_index],
        visitors: monthly_counts.get(key) || 0,
      };
    });

    return chart_data;
  }

  private static async fetchProjectVisitors(
    filter: FilterQuery<Session>,
    company_filter: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{
    rows: ProjectVisitorRowDto[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  }> {
    const sessions = await SessionRepository.getMany(filter, {
      sortField: 'created_at',
      sortOrder: -1,
    });

    const filtered_pairs: Array<{ session: Session; user: User | null }> = [];

    for (const session of sessions) {
      let user: User | null = null;

      if (session.user_id) {
        user = await UserRepository.get({ _id: session.user_id });
      }

      if (company_filter) {
        const company = user?.company_name || '';
        if (!company.toLowerCase().includes(company_filter.toLowerCase())) {
          continue;
        }
      }

      filtered_pairs.push({ session, user });
    }

    const total = filtered_pairs.length;
    const paginated = filtered_pairs.slice(offset, offset + limit);

    const rows: ProjectVisitorRowDto[] = paginated.map(({ session, user }) => {
      const full_name = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
        : null;

      const visitor: VisitorInfoDto = {
        name: full_name || null,
        email: user?.email || null,
        is_meeting_booked: session.is_meeting_booked || false,
      };

      return {
        session_id: (session._id as Types.ObjectId).toString(),
        visitor,
        intent: (session.intent as IntentLevelType) || null,
        demo_booked: session.is_meeting_booked || false,
        company: user?.company_name || null,
        total_duration: session.duration || 0,
        last_visited_on: session.created_at,
      };
    });

    const has_more = offset + limit < total;

    return {
      rows,
      total,
      limit,
      offset,
      has_more,
    };
  }

  private static extractSettledValue<T>(
    result: PromiseSettledResult<T>,
    defaultValue: T,
    errorLogKey: string,
  ): T {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    logger.error(errorLogKey, { error: result.reason });
    return defaultValue;
  }

  private static calculatePercentageChange(
    current: number,
    previous: number,
  ): number {
    if (previous === 0) {
      return current > 0 ? 100.0 : 0.0;
    }
    return ((current - previous) / previous) * 100;
  }

  private static buildOrganizationFilter(organization_id: string): object[] {
    return [{ organization_id: organization_id }];
  }

  private static buildFilter(
    organization_id?: string,
    start_date?: Date,
    end_date?: Date,
    region?: string,
    source?: string,
  ): FilterQuery<Session> {
    const filter: FilterQuery<Session> = {};

    if (organization_id) {
      filter.$or = this.buildOrganizationFilter(organization_id);
    }

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) {
        filter.created_at.$gte = start_date;
      }
      if (end_date) {
        filter.created_at.$lte = end_date;
      }
    }

    if (region) {
      filter.visitor_country = region;
    }

    if (source) {
      filter.visitor_utm_source = source;
    }

    return filter;
  }

  // TODO: Replace with MongoDB aggregation pipeline for better performance
  private static async getTotalInteractions(
    filter: FilterQuery<Session>,
  ): Promise<number> {
    const sessions = await SessionRepository.getMany(filter);
    let total = 0;

    for (const session of sessions) {
      total += session.total_chat_interactions || 0;
      total += session.total_voice_interactions || 0;

      if (session.total_demo_interactions) {
        total += session.total_demo_interactions.human || 0;
        total += session.total_demo_interactions.bot || 0;
      }
    }

    return total;
  }

  // TODO: Replace with MongoDB aggregation pipeline for better performance
  private static async getAverageDuration(
    filter: FilterQuery<Session>,
  ): Promise<number> {
    const sessions = await SessionRepository.getMany(filter);
    const durations: number[] = [];

    for (const session of sessions) {
      if (session.duration !== undefined && session.duration !== null) {
        durations.push(session.duration);
      }
    }

    if (durations.length === 0) {
      return 0.0;
    }

    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    return Math.round(average * 100) / 100;
  }

  // TODO: Replace with MongoDB aggregation pipeline for better performance
  private static async getTotalActiveTime(
    filter: FilterQuery<Session>,
  ): Promise<number> {
    const sessions = await SessionRepository.getMany(filter);
    let total = 0;

    for (const session of sessions) {
      if (session.duration !== undefined && session.duration !== null) {
        total += session.duration;
      }
    }

    return Math.round(total * 100) / 100;
  }

  // TODO: Replace with MongoDB aggregation pipeline for better performance
  private static async getQueriesCount(
    filter: FilterQuery<Session>,
  ): Promise<number> {
    const sessions = await SessionRepository.getMany(filter);
    let total = 0;

    for (const session of sessions) {
      total += session.total_chat_interactions || 0;
      total += session.total_voice_interactions || 0;
    }

    return total;
  }

  private static async getEngagementCount(
    filter: FilterQuery<Session>,
  ): Promise<number> {
    const engagementFilter: FilterQuery<Session> = {
      ...filter,
      $or: [
        { total_chat_interactions: { $gt: 0 } },
        { total_voice_interactions: { $gt: 0 } },
        { 'total_demo_interactions.human': { $gt: 0 } },
        { 'total_demo_interactions.bot': { $gt: 0 } },
      ],
    };

    return await SessionRepository.count(engagementFilter);
  }

  // TODO: Replace with MongoDB aggregation pipeline for better performance
  private static async calculateVisitorMetrics(
    current_filter: FilterQuery<Session>,
    previous_filter: FilterQuery<Session>,
    search_term?: string,
  ): Promise<VisitorsMetricsDto> {
    const current_visits = await SessionRepository.count(current_filter);
    const previous_visits = await SessionRepository.count(previous_filter);
    const visits_change = this.calculatePercentageChange(
      current_visits,
      previous_visits,
    );

    let emails_captured = 0;
    const sessions = await SessionRepository.getMany(current_filter);

    for (const session of sessions) {
      if (!session.user_id) continue;

      const user = await UserRepository.get({ _id: session.user_id });
      if (!user?.email) continue;

      if (search_term) {
        const searchLower = search_term.toLowerCase();
        const full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const nameMatch = full_name.toLowerCase().includes(searchLower);
        const emailMatch = (user.email || '').toLowerCase().includes(searchLower);
        const companyMatch = (user.company_name || '').toLowerCase().includes(searchLower);

        if (nameMatch || emailMatch || companyMatch) {
          emails_captured++;
        }
      } else {
        emails_captured++;
      }
    }

    const queries_asked = await this.getQueriesCount(current_filter);
    const platform_engagement = await this.getEngagementCount(current_filter);

    logger.debug('VISITOR_METRICS_CALCULATED', {
      current_visits,
      previous_visits,
      emails_captured,
      queries_asked,
      platform_engagement,
    });

    return {
      visits: {
        current: current_visits,
        change: Math.round(visits_change * 100) / 100,
      },
      emails_captured,
      queries_asked,
      platform_engagement,
    };
  }

  // TODO: Replace with MongoDB aggregation pipeline for better performance
  private static async fetchVisitorTable(
    filter: FilterQuery<Session>,
    search_term: string | undefined,
    limit: number,
    offset: number,
  ): Promise<VisitorsTableDataDto> {
    logger.debug('FETCHING_VISITOR_TABLE', { limit, offset, search_term });

    const sessions = await SessionRepository.getMany(filter);
    const filtered_pairs: Array<{ session: Session; user: User }> = [];

    for (const session of sessions) {
      if (!session.user_id) continue;

      const user = await UserRepository.get({ _id: session.user_id });
      if (!user?.email) continue;

      const full_name =
        `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (!full_name) continue;

      // Search across name, email, and company
      if (search_term) {
        const searchLower = search_term.toLowerCase();
        const nameMatch = full_name.toLowerCase().includes(searchLower);
        const emailMatch = (user.email || '').toLowerCase().includes(searchLower);
        const companyMatch = (user.company_name || '').toLowerCase().includes(searchLower);

        if (!nameMatch && !emailMatch && !companyMatch) {
          continue;
        }
      }

      filtered_pairs.push({ session, user });
    }

    const total = filtered_pairs.length;
    const paginated = filtered_pairs.slice(offset, offset + limit);

    const rows: VisitorTableRowDto[] = [];

    for (const { session, user } of paginated) {
      const full_name =
        `${user.first_name || ''} ${user.last_name || ''}`.trim();

      const visitor: VisitorInfoDto = {
        name: full_name || null,
        email: user.email || null,
        is_meeting_booked: session.is_meeting_booked || false,
      };

      let pitch_name: string | null = null;
      let thumbnail: string | null = null;

      if (session.organization_project_id) {
        const project = await OrganizationProjectRepository.get({
          _id: session.organization_project_id,
        });
        if (project) {
          pitch_name = project.title || null;
        }

        const slides = await OrganizationSlidesRepository.get({
          organization_project_id: session.organization_project_id,
          is_active: true,
        });
        if (slides) {
          thumbnail = slides.thumbnail || null;
        }
      }

      rows.push({
        session_id: (session._id as Types.ObjectId).toString(),
        visitor,
        intent: (session.intent as IntentLevelType) || null,
        company: user.company_name || null,
        session_duration: session.duration || 0,
        source: session.visitor_utm_source || null,
        visited_on: session.created_at,
        pitch_name,
        thumbnail,
      });
    }

    const has_more = offset + limit < total;

    logger.debug('VISITOR_TABLE_FETCHED', {
      total,
      returned: rows.length,
      has_more,
    });

    return {
      rows,
      total,
      limit,
      offset,
      has_more,
    };
  }
}
