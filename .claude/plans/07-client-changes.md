# Plan — Task 07 part 1

Spec: `.claude/specs/07-client-changes.md`.

## Files

| Change                 | Files                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sizes + rules (shared) | `src/shared/constants.js` (`BANNER`), `src/shared/schemas/banner.schema.js` (slot, upload, alt, `checkBannerSize`)                                         |
| Banner module          | `src/server/modules/banner/banner.{controller,service,repository}.js`; `media.service.js` (folder signature, assets by id); `cache.js` (`TAGS.home`)       |
| Home                   | `page-section.service.js` (`banner` in `getHomeContent`), `HomeHero.jsx` (`<picture>` via `getImageProps`)                                                 |
| Admin                  | `src/app/admin/(panel)/banner/page.js`, `src/components/admin/BannerManager.jsx`, `AdminNav.jsx`, `permissions.js` route                                   |
| Auto-reply             | `resend.adapter.js` (`sendEnquiryAutoReply`, `isAutoReplyConfigured`), `enquiry.service.js` (`after()`)                                                    |
| GA                     | `enquiry.controller.js` (lead cookie), `TrackLead.jsx` (fire only with the cookie)                                                                         |
| Env                    | `env.js` + `.env.example` (`RESEND_BASE_URL`, tests only); `tests/e2e/env.js` (fake Resend values pointing to a local mock; guard: the mock must be local) |
| Docs                   | `2-ARCHITECTURE.md` §5 (new actions) **before** coding; `docs/admin-guide.md` (banner sizes)                                                               |
| Tests                  | unit `banner.test.js`; e2e `client-changes.spec.js` (runs last)                                                                                            |

## Decisions

| Topic                  | Choice                                                                                                   | Why                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Storage                | `site_settings` `home.banner` with asset ids                                                             | design.md §5.1; 2-ARCHITECTURE §3.4                                                    |
| Size check             | Minimums from design.md §5.1, checked on the server from Cloudinary's verified width / height            | The browser can't be trusted                                                           |
| Mobile missing         | Use the desktop banner, then the fallback photo                                                          | Never an empty banner                                                                  |
| Auto-reply timing      | `after()`                                                                                                | Thank-you page is never delayed or blocked (R-7.8)                                     |
| Auto-reply sender      | Only with `ENQUIRY_FROM_EMAIL`; Resend's test sender only reaches the account owner                      | Avoids silent non-delivery                                                             |
| GA signal              | One-time cookie set by the server only for accepted leads                                                | Bots can't trigger it via the honeypot; reloads don't double count                     |
| GA event without GA id | Pushed into `window.dataLayer` only (nothing is sent without the GA script)                              | Lets e2e see the event without a GA id                                                 |
| Email in e2e           | Fake Resend key + `RESEND_BASE_URL` → local mock (only running in the new spec)                          | Never a real email; other suites see a failing send, as today with no key              |
| Banner e2e             | Store a banner from seeded photos via the test DB, then save the alt text in admin (refreshes the cache) | Cloudinary upload needs real keys; the save path, display and removal are still tested |
