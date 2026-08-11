const EMAIL_REGEX = /^([\w-.]+)@((?:[\w-]+\.)+\w{2,})$/;

const GENERIC_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "aol.com",
  "outlook.com",
  "icloud.com",
];

const BLOCKED_DOMAINS = [
  "vanta.com",
  "drata.com",
  "secureframe.com",
  "onetrust.com",
  "hyperproof.io",
  "scrut.io",
  "auditboard.com",
  "scytale.ai",
  "logicgate.com",
  "thoropass.com",
  "upguard.com",
  "metricstream.com",
  "archerirm.com",
  "strikegraph.com",
  "delvetool.com",
  "comp-ai.com",
  "anecdotes.ai",
  "oneleet.com",
];

export type EmailValidationResult = {
  valid: boolean;
  errorMessage: string | null;
};

export type EmailValidationOptions = {
  blockGenericDomains?: boolean;
  blockedDomains?: string[];
};

export function validateEmail(
  email: string,
  options: EmailValidationOptions = {},
): EmailValidationResult {
  const { blockGenericDomains = false, blockedDomains } = options;

  if (!email) {
    return { valid: false, errorMessage: null };
  }

  const match = email.match(EMAIL_REGEX);
  if (!match) {
    return {
      valid: false,
      errorMessage: "Please enter a valid email address.",
    };
  }

  const domain = match[2].toLowerCase();

  if (blockGenericDomains && GENERIC_EMAIL_DOMAINS.includes(domain)) {
    return {
      valid: false,
      errorMessage: "Please enter your business email address.",
    };
  }

  const domainsToBlock = blockedDomains ?? [];
  if (domainsToBlock.length > 0 && domainsToBlock.includes(domain)) {
    return {
      valid: false,
      errorMessage:
        "This domain is blocked. Please use your work email address.",
    };
  }

  return { valid: true, errorMessage: null };
}

export { BLOCKED_DOMAINS, GENERIC_EMAIL_DOMAINS };
