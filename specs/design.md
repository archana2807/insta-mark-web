# Insta Mark website — design

How the site meets [requirements.md](requirements.md). What exists today is
described in [current-state.md](current-state.md). This document covers the
**target**, and marks each change still to build as **(new)** or **(change)**
with the requirement ids it serves. Deeper background: [docs/architecture.md](../docs/architecture.md)
and [docs/database-design.md](../docs/database-design.md).

---

## 1. Principles

1. **Pictures first, little text.** Every page opens with a photo, and products are one click from the home page (R-1.1, R-1.4).
2. **Theme look, own code.** We recreate the Crafto "Branding Agency" demo's layouts and motion without copying its files (R-1.3).
3. **Client data only.** Anything unconfirmed is `null` and hidden. Nothing is invented (R-1.5).
4. **Editable without a developer** for anything the client changes often: banner, photos, projects, logos, FAQs, contact details (R-8, R-10.6).
5. **Works for everyone.** WCAG AA, phone width, no-JS fallbacks, reduced-motion support (R-10).

## 2. Architecture (unchanged)

- **App:** Next.js 15 App Router in plain JS. Server components by default; client components only for interactive leaves.
- **Data:** pages read only through `lib/data/index.js`. It uses Prisma/Postgres (cached with tags) when `DATABASE_URL` is set, otherwise `/content`. Both sources return the same shapes.
- **Writes:** admin writes go through server actions. They validate with Zod, write to the DB, add an audit entry and call `revalidateTag()`.
- **Leads:** validate → store → email. Never report success if the lead was lost.
- **Integrations** (Resend, Turnstile, GA4, Cloudinary, cron) stay optional and env-gated.

---

## 3. Design system

### 3.1 Tokens (`styles/_variables.scss`, unchanged)
| Role | Token | Value |
|---|---|---|
| Accent 1 / 2 | `$brand-orange` / `$brand-teal` | `#b55f0b` / `#177375` (AA-safe versions of the theme's orange and teal) |
| Gradient | `$brand-gradient` | orange → teal, 90° (primary hero button, badge) |
| Headings, dark buttons | `$ink` | `#1d1d1d` |
| Body text | `$body-text` | `#5f5e5e` |
| Secondary text | `$muted` | `#6e6d6d` (never lighter, for AA) |
| Rules / surfaces | `$line` / `$surface` | `#e4e4e4` / `#f7f7f7` |
| Footer | `$charcoal` | `#232323` |
| Page background | — | `#ffffff` (R-1.2) |

Swap the accents once the official logo arrives (Q6). They are the only brand-specific values.

### 3.2 Type
- **Headings and buttons:** Space Grotesk variable (600).
- **Body:** Inter variable (1rem / 1.75).
- **Hosting:** both self-hosted.
- **Display sizes:** use `clamp()` and tight tracking.
- **Eyebrows:** a short gradient rule plus small caps.

### 3.3 Shape, spacing, grid
- **Shape:** square corners everywhere.
- **Container:** max 1240px.
- **Section padding:** generous (`.section`); alternate sections use `$surface`.
- **Grid:** Bootstrap 5 grid. Gutters are `g-4 g-lg-5`, so mobile gutters never exceed the container padding.

### 3.4 Component catalogue
| Component | Used on | Notes |
|---|---|---|
| `HomeHero` **(change)** | Home | Split banner: text left, admin-managed image right; no vertical label (§4.1) |
| `InnerHero` | About, Solutions, category pages, Projects, Contact | Breadcrumb, H1, lead, photo with load wipe and zoom drift |
| `PageHero` **(change → retire)** | Project detail, Privacy | Replace with `InnerHero` (photo optional) for one hero system |
| `SectionHeading`, `Eyebrow` | Everywhere | Staggered entrance |
| `AboutIntro` **(change)** | Home | Title + the two S3 paragraphs if Q2 = yes |
| `CategoryGrid` | Home, category "related" | 4-up desktop, 2-up phone (picture + name only) |
| `ProcessSteps` | Home (4), About (5) | |
| `IconGrid` | Industries | 3D flip entrance |
| `QuoteBand` **(new)** | Home | One large centred line (R-3.9) |
| `Gallery` | Home, categories, Projects | Square tiles, 9 + "Show all", lightbox |
| `LogoStrip` | Home, About | Hidden until logos exist |
| `CtaPanel` | Most pages | Two buttons |
| `FaqSection` | Home **(change, if Q1)**, Contact, categories | Accordion + FAQPage JSON-LD |
| `ShowcaseRow` | Solutions | Theme "services block" |
| `StatementBadge`, `CounterColumns`, `OverlapFeature`, `RowList` | About | |
| `EnquirySection` / `EnquiryForm` | Contact, categories, projects | §6 |

### 3.5 Motion (unchanged, R-9)
- **Scroll entrances:** `Reveal` with the theme's values (600 ms, 30 px, ease-out-quad, staggered).
- **Hero load:** CSS-only rise and image wipe.
- **Scroll drift:** `ScrollDrift`, photo pairs ±30 px in opposite directions.
- **Other effects:** rolling counters, rotating badge, switch-text buttons.
- **Left out:** no marquee, no sliders, no big parallax.
- **Reduced motion:** everything off for reduced-motion users; nothing is hidden without JS.
- **Banner label (change):** the letter blur-in currently runs on the vertical label, which goes away on the home banner (R-3.4).

---

## 4. Page designs

### 4.1 Home **(change)**

Proposed order, pending client answer **Q1**. It follows the updated doc
(S3) and keeps the product grid the client called most important in the meeting:

1. **Banner** (R-3.1–3.4)
2. **About Insta Mark**: title + two paragraphs (R-3.5, Q2)
3. **Product categories grid**: 8 cards (R-3.6; drop only if the client says so in Q1)
4. **Industries We Serve**: 12 tiles (R-3.7)
5. **The Working Process**: 4 steps (R-3.8)
6. **Quote band**: "We craft ideas into impactful signage experiences." (R-3.9)
7. **Featured projects / Trusted by Leading Brands**: text + executed-work photos + client logos (R-3.10, R-3.11)
8. **CTA**: Get a Free Consultation · Contact Our Team (R-3.12)
9. **FAQs**: 5 questions (R-3.13)

CLAUDE.md's "home order" rule must be updated to match once Q1 is answered.

#### Banner (new: admin-managed, desktop + mobile)
- **Layout (desktop ≥ 992px):** text column left with eyebrow, H1, intro and two
  buttons. The image fills the right half, full height under the header.
  No vertical label.
- **Layout (mobile < 992px):** text first, then the mobile image at full width.
- **Rendering:** a `<picture>` with art direction, built with `next/image`'s
  `getImageProps()`. The mobile source is used below 992px and the desktop
  source above. `priority`, `fetchpriority="high"` (it is the LCP image).
- **Fallback:** while no banner is uploaded, show the current hand-picked photo
  (`featured.hero`).

**Sizes to give the client's design team (R-3.2):**

| Banner | Upload size | Shape | Safe area (keep text/logos inside) | Format |
|---|---|---|---|---|
| **Desktop** | **1920 × 1720 px** | ≈ 10:9 | centre **1500 × 1600 px** (edges crop on narrower screens) | JPG or WebP, ≤ 600 KB |
| **Mobile** | **1080 × 1080 px** | 1:1 | centre **960 × 960 px** | JPG or WebP, ≤ 300 KB |

The banner image should **not contain the headline or buttons**. Those stay as
live text on the left, which matters for SEO and accessibility, and stays sharp
on every screen. The mobile frame is fixed at 1:1 (change from today's
"min 380px tall") so the client's artwork is never cropped unexpectedly.

### 4.2 Product category page (R-4)
1. **`InnerHero`**: Solution 0X label, name, Overview as the lead, cover photo (the admin-chosen cover, §5.3), Get a quote / See our work.
2. **Key features** (swing-in list) and **Applications** (text + tags).
3. **Product range**: catalogue images, shown once uploaded (R-4.2).
4. **Our work on site**: executed photos (R-4.3).
5. **Enquiry form**: category pre-selected, with the S3 CTA heading (R-4.4, R-4.5).
6. **FAQs** (category FAQs, else global), then **Related solutions**.

If a category has no photos, use an icon panel instead (no stock photos, R-1.5).

### 4.3 About (R-5)
The order stays as built:
1. Hero
2. Statement + badge (Who We Are)
3. Counters (real counts only)
4. Collage + Vision / Mission
5. Manufacturing
6. **Why Choose Us**
7. Solutions
8. Industries
9. Process (5)
10. CTA

**(change)** Why Choose Us renders the **six S3 About items** (`about.whyChooseUs`) as a
`RowList`. Each row gets a short supporting line taken from the existing home
"why choose" texts where they match. Nothing new is written.

### 4.4 Solutions, Projects, Contact (as built)
- **Solutions:** theme services blocks per category, then the expertise lists and the CTA.
- **Projects:** jump nav, featured projects (admin), galleries per category, CTA.
- **Contact:** hero, form, contact list and map (shown once set), FAQs (moved back to Home if Q1 = doc order; then Contact keeps only the form and map).

### 4.5 Project detail, Privacy **(change)**
- **Heroes:** switch both pages to `InnerHero`. Use the project cover as the hero
  photo; Privacy has no photo.
- **Privacy text:** stays a draft until the client or their legal adviser approves it.

---

## 5. Data and admin changes

### 5.1 Home banner (new, R-3.1, R-8.1)
- **Storage:** no new table. Store it in `site_settings` under key `home.banner`:
  `{ desktopAssetId, mobileAssetId, alt }`. The images are ordinary `media_assets`
  rows (Cloudinary).
- **Data layer:** `getHomeContent()` returns `banner: { desktop, mobile, alt } | null`.
  Both sources return it: the content source gives `null`, which means fallback.
- **Admin:** a new page `/admin/banner`. It's ADMIN and EDITOR, because it is content.
  - Two upload slots, desktop and mobile. Each uses the existing signed Cloudinary flow, checks the minimum pixel size (desktop ≥ 1600 × 1400, mobile ≥ 900 × 900) and shows the recommended sizes from §4.1.
  - One alt-text field.
  - A side-by-side preview of both images.
  - "Remove" brings back the fallback photo.
- **Writes:** audit-logged; revalidate a new tag `TAGS.home`.
- **Asset clean-up:** replaced images are deleted when unused (`deleteAssetsIfUnused`).

### 5.2 Site settings
No change to the fields. Show the visible social links in the footer once they are set (R-2.3).

### 5.3 Category cover (fix, R-8.2)
- **Data:** `db-source.js` selects `heroImage`.
- **Public pages:** `getCategoryCoverImage()` returns the admin-chosen cover first, then the first executed photo, then the first catalogue image.
- **Solutions page:** its photo pair starts with the cover.

### 5.4 Content changes in `/content` (no DB change)
- **Quote:** use `home.quote` (R-3.9).
- **About "Why choose":** use `about.whyChooseUs` (R-5.3).
- **Industry names:** align them once Q4 is answered; also run `SEED_OVERWRITE` or edit in the DB.
- **Fire & Safety Overview:** replace once Q5 is answered.
- **Hero badge:** hide the "10+ years" badge until Q3 confirms the founding year. Change `establishedYear` to `null` in `content/site.js` and the DB setting.

### 5.5 Later (not in this round)
- Admin screen for industries.
- Editable long-form copy (home/about texts in `site_settings` or a `page_blocks` table). Only if the client asks; today copy changes need a developer (R-10.6).

---

## 6. Enquiries

As built (validation, storage, notification, anti-spam; see current-state §2), plus:
- **Customer auto-reply (new, R-7.8):**
  - **When:** sent after the sales notification, only when Resend is configured.
  - **Content:** a short plain message ("We have received your enquiry about *requirement*…"); no prices, no promised response time (R-1.5).
  - **Delivery:** from `ENQUIRY_FROM_EMAIL`, reply-to the sales inbox.
  - **Failure:** logged and never blocks the redirect.
- **GA conversion hygiene (fix):**
  - **Honeypot:** a honeypot hit redirects to `/thank-you?ref=hp`.
  - **Tracking:** `TrackLead` doesn't fire when that parameter is present.

---

## 7. Quality and tooling **(new)**

| Item | Design |
|---|---|
| E2E tests in the repo | Move the Playwright suites (form, admin, a11y/links/SEO crawl, overflow) into `tests/e2e/`, with `npm run test:e2e` |
| Test database | `tests/e2e/db.sh` starts PGlite on 127.0.0.1:5433; the runner **refuses to start** unless `DATABASE_URL` points there (stops test leads reaching production) |
| Lint | `eslint.config.mjs` with `next/core-web-vitals`; `npm run lint` |
| CI | GitHub Action: install, `check:content`, lint, build, e2e against PGlite |
| Clean-up | Delete `StatsLine.jsx` and the dead CSS (`.statement-band`, `.quote-band`, `.showcase-row`, `.stats-line`); retire `PageHero`; fix stale comments; mark Tailwind references in `docs/meeting-summary.md` and `docs/chat-history.md` as superseded by ADR-5 |

## 8. Delivery order

| # | Work | Requirements | Blocked by |
|---|---|---|---|
| 1 | Remove the banner vertical label; hide the founding-year badge | R-3.4, R-1.5 | — |
| 2 | Banner: setting, admin page, `<picture>` rendering; send sizes to the client | R-3.1, R-3.2, R-8.1 | Cloudinary keys for uploads |
| 3 | Home order + About paragraphs + quote band + FAQs on Home | R-3.0, R-3.5, R-3.9, R-3.13 | Q1, Q2 |
| 4 | About "Why Choose Us" from S3 | R-5.3 | — |
| 5 | Category cover fix | R-8.2 | — |
| 6 | Auto-reply email, GA honeypot fix | R-7.8 | Resend keys to test live |
| 7 | One hero system (project detail, privacy) | consistency | — |
| 8 | Tests, lint, CI, clean-up | R-10 | — |
| 9 | Content swaps as the client supplies them: logo, contact details, logos, catalogue, photos, Fire & Safety overview, industry names | R-2.2, R-2.3, R-4.2, R-4.3, R-4.6, R-7.7 | Q3–Q6 |
| 10 | Launch: Vercel Pro, domain, rotate credentials, privacy approval | R-10.5, R-10.7 | Client |

Each step ends with the CLAUDE.md checks: `check:content`, a clean build, and a
browser check at desktop and 390px.
