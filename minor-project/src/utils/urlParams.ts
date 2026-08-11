/**
 * Utility functions for reading project configuration from URL parameters.
 * URL parameters take priority over environment variables/constants.
 *
 * Expected URL format:
 * ?organization_id=xxx&project_id=xxx&type=flows&email_collection=required
 */

export type EmailCollection = "required" | "optional" | "none";

export interface ProjectConfig {
  organizationId: string;
  projectId: string | null;
  projectType: string | null;
  emailCollection: EmailCollection;
}

/**
 * Parses URL search parameters to extract project configuration.
 * @returns Object with organizationId, projectId, projectType, and emailCollection from URL
 */
export function getUrlParams(): Partial<ProjectConfig> {
  if (typeof window === "undefined") {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search);

  const organizationId = searchParams.get("organization_id");
  const projectId = searchParams.get("project_id");
  const projectType = searchParams.get("type");
  const emailCollectionParam = searchParams.get("email_collection");
  const emailCollection: EmailCollection = [
    "required",
    "optional",
    "none",
  ].includes(emailCollectionParam ?? "")
    ? (emailCollectionParam as EmailCollection)
    : "required";

  return {
    ...(organizationId && { organizationId }),
    ...(projectId && { projectId }),
    ...(projectType && { projectType }),
    emailCollection,
  };
}

/**
 * Gets the project configuration with URL parameters taking priority over defaults.
 * @param defaults - Default values to use when URL params are not present
 * @returns Merged configuration with URL params as priority
 */
export function getProjectConfig(defaults: ProjectConfig): ProjectConfig {
  const urlParams = getUrlParams();
  let emailCollection: EmailCollection = "none";

  if (urlParams.projectType === "slides") {
    emailCollection = urlParams.emailCollection ?? defaults.emailCollection;
  }

  return {
    organizationId: urlParams.organizationId || defaults.organizationId,
    projectId: urlParams.projectId ?? defaults.projectId,
    projectType: urlParams.projectType ?? defaults.projectType,
    emailCollection: emailCollection,
  };
}
