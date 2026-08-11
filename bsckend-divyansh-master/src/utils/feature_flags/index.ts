import type { OrganizationConfig } from '../../db/mongo/models/types';
import { FEATURE_NAME } from '../../db/mongo/models/types';

export function isFeatureEnabled(
  organizationConfig: OrganizationConfig | null,
  featureName: FEATURE_NAME,
): boolean {
  if (!organizationConfig) {
    return false;
  }

  const featureFlag = organizationConfig.settings?.feature_flags?.find(
    (flag) => flag.feature_name === featureName,
  );

  return featureFlag?.is_active ?? false;
}

export { FEATURE_NAME };
