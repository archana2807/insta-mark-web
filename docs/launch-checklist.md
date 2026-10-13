# Insta Mark Website: Launch Checklist (Phase 6)

यह document site को पहली बार live करने के लिए है। हर step पूरा होने पर ☐ को ☑ करें।
Commands project folder में चलाने हैं। Secrets कभी Git में नहीं डालने।

---

## A. Accounts बनाएँ (सबके free tiers काफ़ी हैं)

| ☐ | Service | किसलिए | क्या लेना है |
|---|---|---|---|
| ☐ | **GitHub** | Code repository | Private repo, जैसे `insta-mark-web` |
| ☐ | **Vercel** | Hosting + cron | GitHub repo import |
| ☐ | **Neon** | PostgreSQL database | Region **Asia Pacific (Singapore)** या Mumbai (अगर उपलब्ध हो)। दो connection strings: *pooled* और *direct*। |
| ☐ | **Resend** | Enquiry emails | API key + domain verification (DNS records) |
| ☐ | **Cloudinary** | Photos/logos | Cloud name, API key, API secret |
| ☐ | **Cloudflare Turnstile** | Spam protection | Site key + secret key (domain: production domain + `*.vercel.app`) |
| ☐ | **Google Analytics 4** | Traffic + leads | Measurement ID (`G-XXXXXXX`) |
| ☐ | **Google Search Console** | Google indexing | Domain property |

> Accounts **client (Insta Mark) के email पर** बनाएँ और developer को member के रूप में add करें, ताकि ownership client के पास रहे।

---

## B. Secrets generate करें

```bash
# AUTH_SECRET, CRON_SECRET, IP_HASH_SALT — हर एक के लिए अलग value
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## C. Vercel environment variables

Vercel → Project → Settings → Environment Variables (Production + Preview)। पूरी list और हर variable का मतलब [`.env.example`](../.env.example) में है।

| ☐ | Variable | Value |
|---|---|---|
| ☐ | `NEXT_PUBLIC_SITE_URL` | `https://www.<domain>` (बिना आख़िरी `/`) |
| ☐ | `DATABASE_URL` | Neon **pooled** URL + `?sslmode=require&pgbouncer=true` |
| ☐ | `DIRECT_URL` | Neon **direct** URL + `?sslmode=require` |
| ☐ | `AUTH_SECRET` | Step B से |
| ☐ | `IP_HASH_SALT` | Step B से |
| ☐ | `CRON_SECRET` | Step B से |
| ☐ | `RESEND_API_KEY` | Resend |
| ☐ | `ENQUIRY_FROM_EMAIL` | `Insta Mark Website <website@<domain>>` (verified domain से) |
| ☐ | `ENQUIRY_NOTIFY_EMAILS` | Sales team के emails, comma से अलग |
| ☐ | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare |
| ☐ | `NEXT_PUBLIC_GA_ID` | GA4 |
| ☐ | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary |

`NEXT_PUBLIC_*` values build के समय code में बैठ जाती हैं, इसलिए इन्हें बदलने के बाद **redeploy** ज़रूरी है।

Vercel → Settings → General → **Node.js version: 20.x या 22.x**। Build command `vercel.json` से अपने-आप आता है (`npm run build:vercel`), जो migrations भी चलाता है।

---

## D. पहला deploy और database

| ☐ | Step | Command / Action |
|---|---|---|
| ☐ | Code GitHub पर push | Vercel अपने-आप build करेगा। Build log में "applying pending migrations" दिखना चाहिए। |
| ☐ | Initial content (एक बार) | Local machine से: `.env.local` में production `DATABASE_URL` और `DIRECT_URL` डालकर `npm run db:seed` |
| ☐ | पहला admin user | `SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD='…' npm run admin:create` (password 10+ characters) |
| ☐ | Photos Cloudinary पर | `npm run images:migrate -- --dry-run`, फिर बिना `--dry-run` |
| ☐ | `.env.local` से production values हटाएँ | Local machine पर production secrets न रखें |

---

## E. Domain और DNS

| ☐ | Step |
|---|---|
| ☐ | Vercel → Domains → `www.<domain>` और `<domain>` add करें (apex से www पर redirect) |
| ☐ | Domain registrar पर Vercel के बताए DNS records डालें |
| ☐ | Resend के DNS records (SPF/DKIM) डालें और Resend में "Verified" होने का इंतज़ार करें |
| ☐ | HTTPS certificate active (Vercel अपने-आप) |
| ☐ | पुरानी website है तो उसके मुख्य URLs की list बनाएँ और `next.config.mjs` में 301 redirects जोड़ें (SEO बचाने के लिए) |

---

## F. Admin panel में client data भरें (`/admin`)

| ☐ | Item | कहाँ |
|---|---|---|
| ☐ | Phone, WhatsApp, email, address, Google Map embed | Site settings |
| ☐ | Founding year (2016 confirm) | Site settings |
| ☐ | Sales team users (Editor role) | Users |
| ☐ | Client logos (सिर्फ़ जिनकी अनुमति हो) | Client logos |
| ☐ | Named projects (जैसे CCI Residential Tower, Kandivali) + photos | Projects |
| ☐ | Braille Signs और Emergency Lights की photos | Categories & photos |
| ☐ | Catalogue images (type: Catalogue) | Categories & photos |
| ☐ | Official logo SVG और brand colour | Developer: `components/ui/BrandLogo.jsx`, `styles/_variables.scss` |
| ☐ | Privacy policy review | Developer: `app/(site)/privacy-policy/page.js` |
| ☐ | Code में `TODO(client` search करके बाकी items | Developer |

---

## G. Go-live smoke test (live URL पर)

| ☐ | Check | Expected |
|---|---|---|
| ☐ | Home, सभी 8 solutions, projects, about, contact | खुलें, photos दिखें |
| ☐ | Contact form से test enquiry | Thank-you page, **sales email inbox में मिले**, admin → Enquiries में दिखे |
| ☐ | Category page से enquiry | Requirement अपने-आप भरी हो, admin में "Solution page" दिखे |
| ☐ | WhatsApp और Call buttons (mobile) | सही नंबर खुले |
| ☐ | Admin login, एक category text बदलें | Website पर कुछ seconds में दिखे, फिर वापस बदल दें |
| ☐ | Admin में photo upload | Upload हो, website पर दिखे |
| ☐ | GA4 → Realtime | Visit दिखे। Test enquiry के बाद `generate_lead` event दिखे (GA4 में इसे **Key event** mark करें)। |
| ☐ | Cron | Vercel → Crons → `/api/cron/maintenance` "Run" करें, response `ok: true` |
| ☐ | Test enquiries | Admin में status **SPAM** कर दें (90 दिन बाद अपने-आप delete) |
| ☐ | iPhone (Safari) और Android (Chrome) पर पूरा flow | Layout ठीक, form submit होता है |

---

## H. Google

| ☐ | Step |
|---|---|
| ☐ | Search Console: domain verify करें, `https://www.<domain>/sitemap.xml` submit करें |
| ☐ | Search Console → URL Inspection: home और 2 category pages "Request indexing" |
| ☐ | Google Business Profile (अगर है) में website link update करें |
| ☐ | 1–2 हफ़्ते बाद: PageSpeed Insights और Search Console → Core Web Vitals देखें |

---

## I. Handover

| ☐ | Item |
|---|---|
| ☐ | Client को [admin-guide.md](admin-guide.md) देकर 30 मिनट का walkthrough |
| ☐ | सारे accounts की ownership client के email पर हो, developer सिर्फ़ member हो |
| ☐ | Neon → backups / point-in-time restore चालू हो (plan के अनुसार) |
| ☐ | हर महीने: Admin → Enquiries → **Export CSV** (backup) |
| ☐ | Dependency updates: हर 1–2 महीने `npm audit` चलाएँ, Next.js के security patches लें |
