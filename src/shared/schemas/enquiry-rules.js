// Enquiry field rules shared by the browser (instant inline errors) and the
// server (Zod schema in ./enquiry.js), so both always agree. Plain JS, no deps.

export const LIMITS = {
  name: 100,
  company: 150,
  email: 254,
  phone: 20,
  projectLocation: 150,
  requirement: 150,
  message: 2000,
};

export const REQUIRED_FIELDS = ["name", "email", "phone"];

/** Forms submitted faster than this after render are almost certainly bots. */
export const MIN_FILL_MS = 2500;

export const OTHER_REQUIREMENT = "Other";

// Control chars (except \t \n), zero-width and bidi-override characters.
const INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Single-line input: NFC, invisible chars removed, whitespace collapsed. */
export function cleanLine(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Multi-line input: as cleanLine but keeps single blank lines. */
export function cleanText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Phone ─────────────────────────────────────────────────────────────

/** Placeholder-style numbers: 0000000000, 9999999999, 1234567890, 9876543210… */
function isDummyNumber(national) {
  if (/^(\d)\1+$/.test(national)) return true;
  if ("01234567890123456789".includes(national)) return true;
  if ("98765432109876543210".includes(national)) return true;
  return false;
}

/**
 * Normalises Indian/international phone input to E.164.
 * "98765 43210" | "098765-43210" | "+91 98765 43210" → "+919876543210"
 * Returns null when it is not a plausible real number.
 */
export function normalizePhone(input) {
  const raw = String(input ?? "").trim();
  if (!raw || /[^\d\s()+.-]/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");

  let e164 = null;
  if (raw.startsWith("+")) {
    if (digits.startsWith("91")) {
      e164 = digits.length === 12 && /^[2-9]/.test(digits.slice(2)) ? `+${digits}` : null;
    } else if (digits.length >= 8 && digits.length <= 15 && !digits.startsWith("0")) {
      e164 = `+${digits}`;
    }
  } else if (digits.length === 10 && /^[6-9]/.test(digits)) {
    e164 = `+91${digits}`; // mobile
  } else if (digits.length === 11 && /^0[1-9]/.test(digits)) {
    e164 = `+91${digits.slice(1)}`; // 0 + mobile / STD landline
  } else if (digits.length === 12 && /^91[2-9]/.test(digits)) {
    e164 = `+${digits}`;
  }

  if (!e164) return null;
  const national = e164.startsWith("+91") ? e164.slice(3) : e164.slice(-10);
  return isDummyNumber(national) ? null : e164;
}

// ── Email ─────────────────────────────────────────────────────────────

const EMAIL =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;

export function isValidEmail(value) {
  const v = String(value ?? "");
  return v.length <= LIMITS.email && v.split("@")[0].length <= 64 && EMAIL.test(v);
}

const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.in",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "rediffmail.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
];

function editDistance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** "name@gmial.con" → "name@gmail.com"; null when nothing looks mistyped. */
export function suggestEmail(value) {
  const [local, domain] = String(value ?? "")
    .trim()
    .toLowerCase()
    .split("@");
  if (!local || !domain || COMMON_DOMAINS.includes(domain)) return null;
  let best = null;
  let bestScore = 3;
  for (const d of COMMON_DOMAINS) {
    const score = editDistance(domain, d);
    if (score < bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best ? `${local}@${best}` : null;
}

// ── Field rules ───────────────────────────────────────────────────────

const LINK = /(https?:\/\/|www\.)\S+/i;
const LINKS = /(https?:\/\/|www\.)\S+/gi;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

const tooLong = (name) => `Please keep this under ${LIMITS[name]} characters.`;

/**
 * Returns an error message for one (already cleaned) field value, or null.
 * `requirementOptions` (optional) restricts the requirement dropdown values.
 */
export function validateField(name, value, { requirementOptions } = {}) {
  const v = value ?? "";
  const isEmpty = v === "";

  if (REQUIRED_FIELDS.includes(name) && isEmpty) {
    return {
      name: "Please enter your name.",
      email: "Please enter your email address.",
      phone: "Please enter your phone number.",
    }[name];
  }
  if (isEmpty) return null;
  if (LIMITS[name] && v.length > LIMITS[name]) return tooLong(name);

  switch (name) {
    case "name":
      if (!NAME.test(v))
        return "Please use letters only (spaces, dots, hyphens and apostrophes are fine).";
      if ((v.match(/\p{L}/gu) ?? []).length < 2) return "Please enter your full name.";
      return null;
    case "email":
      return isValidEmail(v) ? null : "Please enter a valid email address, e.g. name@company.com.";
    case "phone":
      return normalizePhone(v)
        ? null
        : "Please enter a valid phone number, e.g. 98200 12345 or +91 22 1234 5678.";
    case "company":
    case "projectLocation":
      return LINK.test(v) || /<[a-z/!]/i.test(v)
        ? "Please don't include links or HTML here."
        : null;
    case "requirement":
      if (requirementOptions && ![...requirementOptions, OTHER_REQUIREMENT].includes(v)) {
        return "Please choose a solution from the list.";
      }
      return null;
    case "message": {
      if (/<\s*(a|script|iframe|img)\b|\[url[=\]]/i.test(v))
        return "Please remove HTML or link formatting.";
      if ((v.match(LINKS) ?? []).length > 2) return "Please include no more than 2 links.";
      return null;
    }
    default:
      return null;
  }
}

export const cleanField = (name, value) =>
  name === "message" ? cleanText(value) : cleanLine(value);
