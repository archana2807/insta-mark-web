# 1-PROJECT.md — WHAT we build

> Filled from `specs/requirements.md`, `specs/design.md` and `specs/current-state.md` (21 Oct 2026).
> R-ids link back to `specs/requirements.md`. Status today: ✅ done · 🟡 partial · ⬜ not started · ⚠️ needs client decision.

## 1. Summary
- **Project:** Insta Mark website (`insta-mark-web`)
- **Client:** Insta Mark Private Limited, Mumbai (architectural signage and road safety products)
- **One sentence:** Site and procurement staff browse Insta Mark's 8 product categories and real project photos, then send an enquiry; Insta Mark staff manage content and leads in an admin panel.
- **Deadline / first release:** not set (question 8). A preview is live at https://insta-mark-web.vercel.app.

## 2. Users and roles
| Role | Who | Can do |
|---|---|---|
| Guest | Visitors: site and procurement staff, "not very tech friendly" (R-1.1) | View all public pages, send an enquiry |
| Editor | Insta Mark staff | Dashboard, enquiries (status, owner, notes, CSV), categories and photos, projects, client logos, FAQs, banner |
| Admin | Insta Mark owner / manager | Everything Editor can, plus site settings, users and the audit log |

## 3. Features
Priority: **Must** (release 1) / **Should** / **Later**.

### F1 — Home page (Must)
A short, picture-led home page that leads visitors to the products (R-1.1, R-1.4).
**Done when:**
- [ ] ⚠️ Sections follow the agreed order (R-3.0; question 1).
- [ ] ⬜ The banner shows the desktop image on wide screens and the mobile image on phones; both uploaded in admin (R-3.1, R-8.1).
- [ ] ⬜ The client has the banner sizes for their design team (R-3.2).
- [x] ✅ The banner shows the H1 "Architectural Signage & Road Safety" with the tagline "Signage That Guides. Safety That Lasts." as the small label above it, the intro and the buttons "Explore Our Solutions" and "Request a Consultation" (R-3.3; texts swapped 21 Oct 2026, owner's decision — show the client).
- [ ] ⬜ The banner has no vertical side label (R-3.4).
- [ ] 🟡 The About block shows the title and the agreed text length (R-3.5; question 2).
- [x] ✅ All 8 categories are shown as a grid; clicking one opens its page (R-3.6).
- [x] ✅ Industries (12) and The Working Process (4 steps) are shown (R-3.7, R-3.8).
- [ ] ⬜ The quote "We craft ideas into impactful signage experiences." is shown (R-3.9).
- [ ] 🟡 "Trusted by Leading Brands" text, executed-work photos and client logos (when supplied) are shown (R-3.10, R-3.11).
- [x] ✅ The CTA shows "Get a Free Consultation" and "Contact Our Team" (R-3.12).
- [ ] 🟡 The 5 FAQs are shown where the client wants them (R-3.13; question 1).
- [ ] 🟡 No unconfirmed fact is shown; the "10+ years" badge stays hidden until the founding year is confirmed (R-1.5; question 3).

### F2 — Product category pages, 8 pages (Must)
**Done when:**
- [x] ✅ Each page shows Overview, Key Features, Applications and the CTA text from the client document (R-4.1, R-4.5).
- [ ] 🟡 Catalogue / product images are shown once uploaded (R-4.2).
- [ ] 🟡 Executed-work photos for that category are shown; a category with no photos shows an icon panel, never stock photos (R-4.3).
- [x] ✅ The enquiry form is on the same page, with this category pre-selected (R-4.4).
- [ ] ⚠️ Fire & Safety Signs has a real Overview from the client (R-4.6; question 5).
- [ ] 🟡 The cover photo chosen in admin is the one shown on the site (R-8.2).

### F3 — About page (Must)
**Done when:**
- [x] ✅ The layout follows the theme's About page (R-5.1).
- [x] ✅ Who We Are, Vision, Mission, Solutions, Industries + approach, Manufacturing (12 capabilities + quality) and Our Process (5 steps) are shown (R-5.2, R-5.4–R-5.7).
- [ ] 🟡 "Why Choose Us" shows the six items from the client's About text (R-5.3).

### F4 — Projects (Must)
**Done when:**
- [x] ✅ "Project Portfolio" shows the intro text, executed work grouped by category, and photos that open full size (R-6.1, R-6.2).
- [x] ✅ Named projects added in admin get their own page (R-6.3).
- [x] ✅ Galleries are an even grid: 9 photos, then "Show all" (R-6.5).

### F5 — Contact and enquiry form (Must)
**Done when:**
- [x] ✅ "Get in Touch" page with the form fields Name, Company, Email, Phone, Project Location, Requirement, Message (R-7.1, R-7.2, R-7.3).
- [x] ✅ The browser and the server use the same validation rules; errors show next to fields and in a summary (R-7.4).
- [x] ✅ Every lead is stored before email is sent; the visitor never sees "success" if the lead was lost (R-7.5).
- [x] ✅ Spam protection: honeypot, time trap, rate limit (5 per 10 min per IP), Turnstile when keys are set (R-7.6).
- [ ] 🟡 Phone, email, WhatsApp, address and map are shown once the client confirms them (R-7.7).
- [ ] ⬜ The visitor gets an auto-reply email (R-7.8).
- [x] ✅ The form works without JavaScript.

### F6 — Admin login, users and audit (Must)
**Done when:**
- [x] ✅ Admin and Editor log in with email and password; Editor cannot open settings, users or audit (R-8.5).
- [x] ✅ 5 wrong passwords lock the account for 15 minutes; login is rate-limited; no user enumeration (R-8.5).
- [x] ✅ A password change logs the user out everywhere else (R-8.5).
- [x] ✅ Every admin change, login, logout and lockout is in the audit log (R-8.5).

### F7 — Admin content (Must)
**Done when:**
- [ ] 🟡 Staff can edit category text and photos (catalogue + executed), alt text, order and cover (R-8.2).
- [x] ✅ Staff can manage projects, client logos and FAQs (R-8.3).
- [ ] ⬜ Staff can upload the desktop and mobile banner images (R-8.1).
- [x] ✅ Changes appear on the website without a redeploy (R-10.6, for database content).

### F8 — Enquiry inbox (Must)
**Done when:**
- [x] ✅ Staff can search and filter enquiries, set status (NEW, CONTACTED, QUOTED, WON, LOST, SPAM), assign an owner, add notes and export CSV (R-8.4).
- [x] ✅ The sales team gets an email for each new enquiry when Resend is configured (R-7.5).

### F9 — Site settings (Must)
**Done when:**
- [x] ✅ Admin can edit phone, WhatsApp, email, address, map link, social links and founding year (R-8.3).
- [x] ✅ Empty values stay hidden on the website (R-1.5).

### F10 — Look, motion and quality (Must)
**Done when:**
- [x] ✅ The site recreates the Crafto "Branding Agency" demo in our own code, on a white background (R-1.2, R-1.3).
- [x] ✅ Motion follows the demo, without marquee or sliders; reduced-motion users see none; nothing is hidden without JS (R-9.1–R-9.4).
- [x] ✅ WCAG 2.1 AA (axe 0 violations) and no sideways scroll at 390 px (R-10.1, R-2.4).
- [ ] 🟡 Lighthouse mobile ≥ 90 and LCP ≤ 2.5 s on production (R-10.2).
- [x] ✅ Metadata, canonical URLs, sitemap, robots and structured data on every page (R-10.3).

### F11 — Long-form text editing in admin (Later)
Home and About text is edited in `/content` by a developer today. Build an editor only if the client asks (R-10.6).

## 4. Pages / screens
| Page | URL | Roles | Main content and actions | Feature |
|---|---|---|---|---|
| Home | `/` | Guest | Banner, about, product grid, process, sectors, photos, CTA | F1 |
| Solutions | `/solutions` | Guest | All 8 categories as theme service blocks, expertise lists | F2 |
| Category | `/solutions/[slug]` (8) | Guest | Overview, features, applications, photos, enquiry form, FAQs | F2 |
| About | `/about` | Guest | Company story, why choose us, manufacturing, process | F3 |
| Projects | `/projects` | Guest | Featured projects, photos by category | F4 |
| Project | `/projects/[slug]` | Guest | Photos, facts, enquiry form | F4 |
| Contact | `/contact` | Guest | Enquiry form, contact details, map, FAQs | F5 |
| Thank you | `/thank-you` | Guest | Confirmation (not indexed) | F5 |
| Privacy policy | `/privacy-policy` | Guest | Draft policy text | — |
| 404 | any unknown URL | Guest | Friendly not-found page | — |
| Admin login | `/admin/login` | Guest | Email + password | F6 |
| Dashboard | `/admin` | Editor, Admin | Counts, recent enquiries | F8 |
| Enquiries | `/admin/enquiries`, `/admin/enquiries/[id]` | Editor, Admin | List, filters, detail, status, notes, CSV | F8 |
| Categories | `/admin/categories`, `/admin/categories/[id]` | Editor, Admin | Text, photos, cover | F7 |
| Projects | `/admin/projects`, `/new`, `/[id]` | Editor, Admin | Create, edit, delete, gallery | F7 |
| Client logos | `/admin/clients` | Editor, Admin | Upload, order, hide | F7 |
| FAQs | `/admin/faqs` | Editor, Admin | Global / per category, home flag | F7 |
| Banner | `/admin/banner` | Editor, Admin | Desktop + mobile images (new) | F7 |
| Settings | `/admin/settings` | Admin | Contact, socials, founding year | F9 |
| Users | `/admin/users` | Admin | Create, role, deactivate, reset password | F6 |
| Audit log | `/admin/audit` | Admin | All changes and logins | F6 |
| My account | `/admin/account` | Editor, Admin | Change own password | F6 |

## 5. Business rules
- Never show an unconfirmed client fact (phone, address, clients, stats, founding year, promises). Unset values stay hidden (R-1.5).
- A lead is stored first, then emailed. Never show "success" if the lead was not stored or sent (R-7.5).
- Phone numbers are saved in E.164 format (+91…). Dummy numbers such as 9999999999 are rejected.
- The enquiry "Requirement" must be one of the current category names, or "Other".
- Turnstile: block a rejected token; accept the lead if Cloudflare is down (ADR-10).
- Visitor IPs are stored only as a hash.
- Data retention: SPAM enquiries deleted after 90 days, audit logs after 1 year, enquiries anonymised after 3 years.
- Every image needs real width/height and descriptive alt text.

## 6. Notifications
| Event | To | Channel | Content |
|---|---|---|---|
| New enquiry | Sales team (`ENQUIRY_NOTIFY_EMAILS`) | Email (Resend) | All form fields, source page, UTM; reply-to = visitor |
| New enquiry (new) | Visitor | Email (Resend) | Short "we received your enquiry about …"; no prices, no promised response time (R-7.8) |
| Failed sales email | Sales team | Email (daily cron retry) | Same as above |

## 7. Integrations
| Service | Used for | Who provides keys | Mock in dev? |
|---|---|---|---|
| Neon (PostgreSQL) | Database | Team (account owner) | Yes: PGlite on 127.0.0.1:5433 |
| Resend | Enquiry emails | Client domain + team account | Off when keys are empty |
| Cloudinary | Admin photo and logo uploads | Team / client | Off when keys are empty |
| Cloudflare Turnstile | Spam check on the form | Team / client | Test keys, or off |
| Google Analytics 4 | `generate_lead` conversion | Client | Off when the ID is empty |
| Vercel | Hosting, cron | Team account | Preview links |

## 8. Numbers
- Admin users: a few staff (exact number unknown — question 9).
- Enquiries, projects and photos per year: unknown (question 9).
- Content today: 8 categories, 78 photos, 12 industries, 5 FAQs.
- Page load target: Lighthouse mobile ≥ 90, LCP ≤ 2.5 s (R-10.2).

## 9. NOT to build (release 1)
- Online payment
- Multi-language (English only)
- Blog
- Sliders, carousels, marquees, big parallax backgrounds
- Customer accounts or customer login (only Insta Mark staff log in)

## 10. Content, data and design
- **Design:** Crafto HTML "Branding Agency" demo (home, about, services pages), recreated in our own code; white background. Details in `docs/DESIGN.md`.
- **Brand colours / logo:** orange `#b55f0b` → teal `#177375` gradient, ink `#1d1d1d`. The official logo SVG has not been received yet (placeholder "im" mark).
- **Existing data:** client content documents (PDF, then the Google Doc of 15 Oct), 78 executed-work photos sorted into 6 categories.
- **Languages:** English.

## 11. Open questions
1. **Home order (Q1):** the client's 15 Oct doc has no product grid on Home, but in the meeting the client said products matter most. Keep the grid right after About? (Recommended: yes.) Also: FAQs on Home or on Contact? **Until the client answers, the old rule stays: products right after About.**
2. **About text on Home (Q2):** the two full paragraphs (doc) or 1–2 lines (meeting)?
3. **Founding year (Q3):** please confirm. 2016 came from IndiaMART.
4. **Industry names (Q4):** "Manufacturing Facilities" or "Industrial Facilities"; "Government & Infrastructure Projects" or "Government & Infrastructure"?
5. **Fire & Safety Overview (Q5):** the doc repeats the Applications list. Please send the real Overview.
6. **Assets (Q6):** official logo (SVG), phone/email/WhatsApp/address/map, client logos, catalogue images, photos for Braille Signs and Emergency Lights, high-res photos.
7. **Vertical label (Q7):** remove it from inner-page heroes too, or only from the Home banner?
8. **Deadline:** when is the first public release? (Answer of 21 Oct still had the placeholder `[date]`.)
9. **Numbers:** how many staff will log in (client / our team), and roughly how many enquiries per month? (Answer of 21 Oct still had placeholders.)
