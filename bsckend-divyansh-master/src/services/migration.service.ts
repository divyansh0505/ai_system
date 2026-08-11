import mongoose from 'mongoose';

import { OrganizationConfigRepository } from '../db/mongo/repository';
import type { ORGANIZATION_PROJECT_TYPE } from '../db/mongo/models/types';
import logger from '../utils/logger';
import type { ServiceError } from './types';

interface OldProjectTypeAgentMapping {
  _id: mongoose.Types.ObjectId;
  project_type: ORGANIZATION_PROJECT_TYPE;
  agent_name: string;
  is_active: boolean;
}

interface MigrationResult {
  total_mappings_found: number;
  total_configs_updated: number;
  mappings: OldProjectTypeAgentMapping[];
}

export class MigrationService {
  /**
   * Migrates project_type_agent_mappings to organization_config.agents array.
   * This is a one-time migration to move from the separate mapping table
   * to having agents defined per organization config.
   */
  static async migrateAgentMappingsToOrgConfig(): Promise<
    MigrationResult | ServiceError
  > {
    try {
      logger.info('MIGRATION_AGENT_MAPPINGS_START');

      // Query the old collection directly
      const oldMappings = (await mongoose.connection
        .collection('project_type_agent_mappings')
        .find({})
        .toArray()) as unknown as OldProjectTypeAgentMapping[];

      logger.info('MIGRATION_FOUND_OLD_MAPPINGS', {
        count: oldMappings.length,
      });

      if (oldMappings.length === 0) {
        return {
          total_mappings_found: 0,
          total_configs_updated: 0,
          mappings: [],
        };
      }

      // Get all organization configs
      const allConfigs = await OrganizationConfigRepository.getMany({});

      logger.info('MIGRATION_FOUND_ORG_CONFIGS', {
        count: allConfigs.length,
      });

      // Build the agents array from old mappings
      const agentsArray = oldMappings.map((mapping) => ({
        project_type: mapping.project_type,
        agent_name: mapping.agent_name,
        is_active: mapping.is_active,
      }));

      // Update each organization config with the agents array
      let updatedCount = 0;
      for (const config of allConfigs) {
        const updated = await OrganizationConfigRepository.update(
          { _id: config._id },
          { agents: agentsArray },
        );

        if (updated) {
          updatedCount++;
          logger.info('MIGRATION_UPDATED_ORG_CONFIG', {
            config_id: config._id.toString(),
            agents_count: agentsArray.length,
          });
        }
      }

      logger.info('MIGRATION_AGENT_MAPPINGS_COMPLETE', {
        total_mappings: oldMappings.length,
        total_configs_updated: updatedCount,
      });

      return {
        total_mappings_found: oldMappings.length,
        total_configs_updated: updatedCount,
        mappings: oldMappings,
      };
    } catch (error) {
      logger.error('MIGRATION_AGENT_MAPPINGS_ERROR', {
        error_message: (error as Error).message,
      });
      return {
        code: 500,
        message: `Migration failed: ${(error as Error).message}`,
      };
    }
  }
}
