export type EmailValidationResult = {
  valid: boolean;
  normalizedEmail: string;
  domain: string;
  error?: string;
  suggestedEmail?: string;
};

// Common provider typos (including @mail.com when users mistype @gmail.com)
const DOMAIN_TYPO_SUGGESTIONS: Record<string, string> = {
  // Gmail typos
  "mail.com": "gmail.com",
  "email.com": "gmail.com",
  "emai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gml.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.coom": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.net": "gmail.com",
  "gmail.org": "gmail.com",
  "gogglemail.com": "gmail.com",
  "googlemai.com": "gmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "yaoo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.cmo": "yahoo.com",
  "yahoo.comm": "yahoo.com",
  "yahoo.cm": "yahoo.com",
  "ymail.co": "ymail.com",
  "ymail.con": "ymail.com",

  // Outlook / Hotmail typos
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "oulook.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.cmo": "outlook.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "htmail.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.cmo": "hotmail.com",
  "live.con": "live.com",

  // iCloud typos
  "icoud.com": "icloud.com",
  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
};

const BLOCKED_TLDS = new Set([
  "con",
  "cmo",
  "comm",
  "coom",
  "cm",
  "om",
  "local",
  "invalid",
  "test",
  "localhost",
]);

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "invalid.com",
  "tempmail.com",
  "temp-mail.org",
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
]);

const LOCAL_PART_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL_REGEX = /^[a-z0-9-]+$/;
const TLD_REGEX = /^[a-z]{2,24}$/;

export function validateEmailFormatAndDomain(rawEmail: string): EmailValidationResult {
  const normalizedEmail = rawEmail.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      valid: false,
      normalizedEmail,
      domain: "",
      error: "Please enter your email address.",
    };
  }

  if (normalizedEmail.includes(" ")) {
    return {
      valid: false,
      normalizedEmail,
      domain: "",
      error: "Email address cannot contain spaces.",
    };
  }

  const parts = normalizedEmail.split("@");
  if (parts.length !== 2) {
    return {
      valid: false,
      normalizedEmail,
      domain: "",
      error: "Please enter a valid email address (e.g., name@gmail.com).",
    };
  }

  const [localPart, domain] = parts;

  if (
    !localPart ||
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    !LOCAL_PART_REGEX.test(localPart)
  ) {
    return {
      valid: false,
      normalizedEmail,
      domain,
      error: "Please enter a valid email username before the '@' symbol.",
    };
  }

  if (!domain || domain.length > 253 || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return {
      valid: false,
      normalizedEmail,
      domain,
      error: "Please enter a valid email domain after the '@' symbol.",
    };
  }

  // Check explicit typo domain table first so we can suggest the exact fix
  const suggestedDomain = DOMAIN_TYPO_SUGGESTIONS[domain];
  if (suggestedDomain) {
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    return {
      valid: false,
      normalizedEmail,
      domain,
      suggestedEmail,
      error: `Invalid or mistyped email domain "@${domain}". Did you mean ${suggestedEmail}?`,
    };
  }

  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valid: false,
      normalizedEmail,
      domain,
      error: "Disposable or placeholder email addresses are not allowed.",
    };
  }

  const domainLabels = domain.split(".");
  if (domainLabels.length < 2) {
    return {
      valid: false,
      normalizedEmail,
      domain,
      error: "Please include a full email domain (e.g., @gmail.com).",
    };
  }

  for (const label of domainLabels) {
    if (
      !label ||
      label.length > 63 ||
      label.startsWith("-") ||
      label.endsWith("-") ||
      !DOMAIN_LABEL_REGEX.test(label)
    ) {
      return {
        valid: false,
        normalizedEmail,
        domain,
        error: "Email domain contains invalid characters.",
      };
    }
  }

  const tld = domainLabels[domainLabels.length - 1];
  if (!TLD_REGEX.test(tld) || BLOCKED_TLDS.has(tld)) {
    return {
      valid: false,
      normalizedEmail,
      domain,
      error: `Invalid email domain ending ".${tld}". Please check your email spelling.`,
    };
  }

  return {
    valid: true,
    normalizedEmail,
    domain,
  };
}

