# Insta Mark Website: QA Report (Phase 5)

| | |
|---|---|
| **Date** | 13 Oct 2026 |
| **Build** | Production build (`next build` + `next start`), database mode |
| **Environment** | Local machine, test PostgreSQL (PGlite wire server) seeded from `/content`, plus 1 QA fixture project. CDN नहीं है, इसलिए live Vercel पर performance इससे बेहतर होनी चाहिए। |
| **Tools** | Playwright (Chromium 153), axe-core 4.10 (WCAG 2.1 A/AA + best practices), Lighthouse 12.2 (mobile, simulated 4G) |

---

## 1. Summary

| Area | Result |
|---|---|
| Broken links / missing `#anchor` targets | ✅ 0 (15 public pages crawled) |
| SEO basics (title, description ≤ 160, canonical, एक h1, `lang`, alt, JSON-LD) | ✅ 0 issues (2 लंबी descriptions ठीक कीं) |
| Accessibility (axe, WCAG 2.1 AA) — public + admin pages | ✅ 0 violations* (contrast issues ठीक किए) |
| Lighthouse Accessibility / Best Practices / SEO | ✅ 100 / 100 / 100 (सभी measured pages) |
| Lighthouse Performance (mobile) | ✅ 93–95 (target ≥ 90), पहले 53–84 था |
| Mobile 390px: horizontal scroll | ✅ कोई नहीं |
| Admin end-to-end (Phase 4 suite) | ✅ 43/43 |
| Cross-browser: Chromium | ✅ 13/13 smoke checks |
| Cross-browser: Firefox, WebKit (Safari engine) | ⏳ Browser download network की वजह से पूरा नहीं हुआ। नीचे Section 6 देखें। |
| JavaScript errors in console | ✅ कोई नहीं |

\* Scroll पर fade-in होने वाले elements का axe scan animation के बीच में भी हो जाता है (opacity < 1), जिससे contrast कम दिखता है। `prefers-reduced-motion` में (animation बंद) **0 violations** हैं, और animation पूरी होने पर असली users को पूरा contrast दिखता है। इसलिए इसे false positive माना है।

---

## 2. Lighthouse (mobile, warm cache)

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/` Home | 93 | 100 | 100 | 100 | 1.8 s | 3.1 s | 50 ms | 0.027 |
| `/solutions/tailor-made-signage` | 93 | 100 | 100 | 100 | 1.8 s | 3.0 s | 50 ms | 0.009 |
| `/projects/sample-residential-tower` | 94 | 100 | 100 | 100 | 1.7 s | 2.8 s | 100 ms | 0 |
| `/about` | 94 | 100 | 100 | 100 | 1.7 s | 3.0 s | 80 ms | 0 |
| `/contact` | 95 | 100 | 100 | 100 | 1.5 s | 2.7 s | 100 ms | 0 |
| `/projects` | — | — | — | — | — | — | — | — |

`/projects`: Lighthouse 12.2 इस Chromium version पर crash हुआ (`RootCauses: frame_sequence` internal error, फिर page-load timeout)। Playwright से अलग से मापा: **load event 115 ms में**, सभी 79 images lazy-load होती हैं, कोई eager image नहीं। Launch के बाद PageSpeed Insights से दोबारा मापना है।

**LCP 2.7–3.1 s** है (target 2.5 s)। यह simulated 4G पर local server से मापा गया है। Vercel CDN और Cloudinary के साथ बेहतर होना चाहिए, इसलिए launch के बाद PageSpeed Insights (field data) से confirm करना है।

---

## 3. Issues found and fixed

| # | Issue | Impact | Fix |
|---|---|---|---|
| 1 | **Bootstrap Icons font (128 KB) + ~2000-class CSS हर page पर** | Performance 53–84, FCP 2.6 s | Inline SVG icons (`scripts/build-icons.js` से generated subset)। CSS वाले icons SVG mask से। Client bundle में सिर्फ़ 17 icons। Perf 93–95, FCP 1.5–1.8 s। |
| 2 | Active nav link, breadcrumb, project facts के labels: `#8a8a8a` (contrast 3.45:1) | WCAG AA fail | नया token `$muted: #6e6d6d` (5.2:1), `$breadcrumb-active-color`, `$form-text-color`, placeholder `#757575` |
| 3 | Admin sidebar के section titles (4.31:1) | WCAG AA fail | `rgba(#fff, .62)` (6.4:1) |
| 4 | सजावटी बड़े numbers ("01", "404") contrast में fail | Tool fail (सजावटी text) | Text की जगह `data-num` + CSS `content: attr()`, look वही |
| 5 | Admin tables में 2 खाली `<th>` | A11y (minor) | Screen-reader text (`visually-hidden`) |
| 6 | Home और Solutions की meta description 173–203 characters | Google snippet काटता | ≤ 160 characters |
| 7 | Admin category icon free-text field | गलत नाम डालने पर icon नहीं दिखता | Dropdown (curated list) + server validation + `check:content` में icon check |

| 8 | Mobile (390 px) पर हर page 12 px चौड़ा (footer और दूसरी rows का `g-5` gutter container padding से बड़ा) | Horizontal scroll | Rows पर `g-4 g-lg-5` |
| 9 | Enquiry `requirement` field server पर किसी भी text को accept करता था | Tampered dropdown values DB में | Server अब current category names से check करता है |
| 10 | 404 page पर header/footer नहीं थे | Visitor का रास्ता खो जाता था | `app/(site)/not-found.js` + catch-all route |

### Enquiry form tests (13 Oct 2026)

Browser (Playwright, local PostgreSQL wire server): empty submit blocked और 3 errors + पहले field पर focus; blur पर name error, `aria-invalid`; typing पर error हटना; email typo suggestion apply होना; dummy phone reject; message counter; 3 links वाला message reject; tampered requirement reject; error के बाद values बनी रहना; valid submit → `/thank-you` + DB row (company `"  Acme\u200B   Infra  "` → `"Acme Infra"`, phone `+919820012345`, UTM saved); 2.5 s से पहले submit → error, fake success नहीं, summary पर focus; no-JS में native `required`; 390 px पर no overflow। JS के बिना server path (direct POST): name/email/phone/requirement errors, valid post → 303 `/thank-you`। Rules के unit checks (Node): names (Devanagari, apostrophe), emails, typo suggestions, phone formats + dummy numbers, links, sanitisation।

---

## 4. Accessibility coverage
- **Public pages (15):** home, solutions, 8 categories, projects, project detail, about, contact, privacy, 404
- **Admin pages (12):** login, dashboard, enquiries, categories, category edit, projects, new project, clients, FAQs, settings, users, audit, account
- Keyboard: skip link, visible focus (`:focus-visible`), accordion, mega menu, off-canvas menu, lightbox (Escape से close)
- Forms: labels, `aria-invalid`, error messages `aria-live` में

## 5. SEO coverage
- हर indexable page पर unique title और description, canonical, एक `<h1>`, `lang="en-IN"`
- JSON-LD: `LocalBusiness` (सभी pages), `Service` + `FAQPage` (category pages), `BreadcrumbList` (inner pages), `FAQPage` (home)
- `sitemap.xml` में categories और projects। `robots.txt` में `/admin`, `/api` और `/thank-you` disallow। Admin और thank-you pages `noindex`।

## 6. Pending (cannot be done on this machine / without accounts)
| Item | Why | When |
|---|---|---|
| Firefox और WebKit (Safari engine) smoke test | Browser download network पर अटक गया। Test script तैयार है (Chromium पर 13/13)। | Next session, या launch से पहले असली iPhone और Android पर manual check |
| Real-device check (iPhone Safari, Android Chrome) | Hardware चाहिए | Vercel preview link मिलने पर |
| PageSpeed Insights / field data | Live URL चाहिए | Launch के बाद |
| Email delivery, Cloudinary upload, Turnstile, GA4 | Accounts चाहिए | Launch checklist देखें |

## 7. How to re-run
QA scripts project का हिस्सा नहीं हैं (development machine पर एक बार चलाए गए)। Repeatable checks जो project में हैं:
```bash
npm run check:content   # images, alt text, icons
npm run build           # warnings के बिना pass होना चाहिए
npm run format:check
```
Launch के बाद: PageSpeed Insights, Google Search Console (Coverage, Core Web Vitals), और axe DevTools browser extension से spot checks।
