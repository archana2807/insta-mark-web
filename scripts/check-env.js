// Reports which integrations are configured — never prints secret values.
//   node scripts/check-env.js                 (reads process.env)
//   node --env-file=.env.production.local scripts/check-env.js
// Exits 1 if anything REQUIRED for a production launch is missing or invalid.

const env = process.env;
const set = (k) => Boolean(env[k] && env[k].trim());

const checks = [
  // [label, required, ok, hint]
  [
    "NEXT_PUBLIC_SITE_URL is https",
    true,
    /^https:\/\/[^/]+$/.test(env.NEXT_PUBLIC_SITE_URL ?? ""),
    "e.g. https://www.example.in (no trailing slash)",
  ],
  [
    "DATABASE_URL (pooled, pgbouncer=true)",
    true,
    set("DATABASE_URL") && /pgbouncer=true/.test(env.DATABASE_URL),
    "Neon pooled URL + ?sslmode=require&pgbouncer=true",
  ],
  ["DIRECT_URL", true, set("DIRECT_URL"), "Neon direct URL (migrations)"],
  ["AUTH_SECRET ≥ 32 chars", true, (env.AUTH_SECRET ?? "").length >= 32, "random 32+ chars"],
  ["IP_HASH_SALT", true, set("IP_HASH_SALT"), "random string"],
  ["CRON_SECRET", true, set("CRON_SECRET"), "random string"],
  [
    "Enquiry email (RESEND_API_KEY + ENQUIRY_NOTIFY_EMAILS)",
    true,
    set("RESEND_API_KEY") && set("ENQUIRY_NOTIFY_EMAILS"),
    "Resend API key + sales inbox",
  ],
  ["ENQUIRY_FROM_EMAIL", false, set("ENQUIRY_FROM_EMAIL"), "sender on a Resend-verified domain"],
  [
    "Turnstile (both keys)",
    false,
    set("NEXT_PUBLIC_TURNSTILE_SITE_KEY") && set("TURNSTILE_SECRET_KEY"),
    "spam protection",
  ],
  [
    "Google Analytics (NEXT_PUBLIC_GA_ID)",
    false,
    /^G-[A-Z0-9]+$/.test(env.NEXT_PUBLIC_GA_ID ?? ""),
    "G-XXXXXXX",
  ],
  [
    "Cloudinary (3 vars)",
    false,
    ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every(set),
    "admin photo uploads",
  ],
];

let missingRequired = 0;
for (const [label, required, ok, hint] of checks) {
  const mark = ok ? "✓" : required ? "✗" : "–";
  if (!ok && required) missingRequired++;
  console.log(`${mark} ${label}${ok ? "" : `  (${required ? "REQUIRED" : "optional"}: ${hint})`}`);
}
console.log(
  missingRequired ? `\n${missingRequired} required setting(s) missing.` : "\nReady for production.",
);
process.exit(missingRequired ? 1 : 0);
