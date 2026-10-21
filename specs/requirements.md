# Insta Mark website — requirements

What the website must do, traced to where each requirement came from, with its
status against [current-state.md](current-state.md) (commit `ff09d02`).
How we meet them is in [design.md](design.md).

## Sources

| Id | Source | Date |
|---|---|---|
| **S1** | Client meeting recording (Google Meet, ~17 min) — summary in [docs/meeting-summary.md](../docs/meeting-summary.md) | 8 Oct 2026 |
| **S2** | `Website_Content_Insta_Mark.pdf` — first content document | 8 Oct 2026 |
| **S3** | Client's **updated** Google Doc "Insta Mark Website Content" (banner note + full copy) | 15 Oct 2026 |
| **S4** | Team review feedback in the build chat (flow, animation, gallery, theme motion) | 13–14 Oct 2026 |
| **S5** | Project decisions: stack, hosting, rules in [CLAUDE.md](../CLAUDE.md) | Oct 2026 |

Where sources disagree, the **later client source wins** (S3 over S2 over S1),
except where noted as an open question (§11).

**Status values:** ✅ done · 🟡 partial · ⬜ not started · ⚠️ conflict / needs client decision

---

## 1. Audience and tone

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-1.1 | Primary visitors are site and procurement staff, "not very tech friendly". The site must be simple, short and **picture-led**: "nobody wants to read, you put images". | S1 | ✅ |
| R-1.2 | White background (the reference theme is cream). | S1 | ✅ |
| R-1.3 | Look and feel of the Crafto "Branding Agency" demo: "simple, nice, very professional". Recreate it in our own code. | S1, S5 | ✅ |
| R-1.4 | "Follow the flow of my catalogue". Products are the most important content. | S1 | ✅ (see ⚠️ R-3.0) |
| R-1.5 | Never invent client facts (phone, address, clients, stats, testimonials, promises). Unset values stay hidden. | S5 | 🟡 "10+ years" badge uses an unconfirmed founding year |

## 2. Global layout

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-2.1 | Header: logo left; links to Home, Solutions (all 8 categories), Projects, About, Contact; a "Get a Quote" button. | S1, S2 | ✅ |
| R-2.2 | The client's logo goes in the header (agency decides placement relative to the banner). | S1 | 🟡 placeholder "im" mark until the official SVG arrives |
| R-2.3 | Footer with company links, solution links and contact details. | S2 | 🟡 contact details not supplied yet |
| R-2.4 | Every page works at phone width with no horizontal scroll. | S5 | ✅ |
| R-2.5 | Unknown URLs show a friendly 404 inside the normal header and footer. | S5 | ✅ |

## 3. Home page

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-3.0 | **Section order.** S1: banner → 1–2 line about → product categories grid → working process → sectors → ending with pictures. S3: banner → About → Industries → Working Process → quote → Featured Projects (logos) → Trusted by Leading Brands → CTA → FAQs, **with no product grid**. | S1, S3 | ⚠️ Q1 |
| R-3.1 | **Banner image** is designed by the client's team and **uploaded from the admin panel**, with **separate desktop and mobile images**. | S3 | ⬜ |
| R-3.2 | Give the client the **desktop and mobile banner sizes** for their design team. | S3 | ⬜ (proposed in design.md §4.1) |
| R-3.3 | Banner left side: H1 "Architectural Signage & Road Safety" with the tagline "Signage That Guides. Safety That Lasts." as the vertical label (wide screens) or a smaller line under the H1 (below 1200 px), no label above (client feedback 21 Oct 2026), the intro sentence, and buttons **Explore Our Solutions** and **Request a Consultation**. | S2, S3 | ✅ |
| R-3.4 | **Vertical label** on the left of the banner ("advance branding solutions" in the reference): the old "Signage · Wayfinding · Road Safety" is removed; since 21 Oct 2026 it shows the tagline "Signage That Guides. Safety That Lasts." (wide screens), and the H1 runs onto the photo as in the theme. | S3 | ✅ |
| R-3.5 | About block: "About Insta Mark", title "Creating Signage That Makes Every Space Smarter" and **two paragraphs** (S3). S1 asked for 1–2 lines. | S1, S3 | 🟡 shows one short line (Q2); since 21 Oct 2026 three overlapping photos on the left, the text on the right (as in the theme) |
| R-3.6 | Product categories grid: all 8 categories; clicking opens the category page. | S1 | ✅ |
| R-3.7 | Industries We Serve: 12 sectors. | S1, S2, S3 | ✅ (name differences, Q4) |
| R-3.8 | The Working Process: 4 steps (Site Survey, Design Concept, Manufacturing, Installation) with the S3 text. | S1, S3 | ✅ |
| R-3.9 | Quote: "We craft ideas into impactful signage experiences." | S2, S3 | ⬜ not shown anywhere |
| R-3.10 | Featured Projects / client logos ("pick logos from the website") + "Trusted by Leading Brands" text. | S2, S3 | 🟡 text and photos shown; since 21 Oct 2026 a row of 4 project logos (from the company profile PDF) sits right under the banner; more logos when clean files arrive |
| R-3.11 | Pictures of executed work near the end of the page. | S1 | ✅ |
| R-3.12 | CTA "Let's Build Smarter Spaces Together." with **Get a Free Consultation** and **Contact Our Team**. | S2, S3 | ✅ |
| R-3.13 | FAQs (5) on the home page. | S2, S3 | 🟡 moved to Contact on 14 Oct for brevity; S3 lists them on Home (Q1) |

## 4. Product category pages (8)

Categories: Tailor-made Signage, Modular Signs, General Signs, Braille Signs,
Fire & Safety Signs, Emergency Lights, Road Signs, Road Safety Products.

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-4.1 | Each page shows the written content: Overview, Key Features, Applications, Call to Action. Copy as in S3. | S1, S2, S3 | ✅ |
| R-4.2 | Then **catalogue / product images** ("product profiles" from the client's catalogue). | S1 | 🟡 section built; no images received |
| R-4.3 | Then **real photos of executed work** for that category. | S1 | 🟡 6 of 8 categories have photos (none for Braille, Emergency Lights) |
| R-4.4 | **Enquiry form on the same page**, so the visitor doesn't have to go elsewhere. | S1 | ✅ |
| R-4.5 | Category CTA text: "Looking for reliable *X* solutions? Contact Insta Mark today for expert consultation and a customized quotation." | S2, S3 | ✅ |
| R-4.6 | Fire & Safety Signs needs a real Overview. The S2 and S3 text repeats the applications list. | S3 | ⚠️ Q5 |

## 5. About page

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-5.1 | Layout like the theme's About page. | S4 | ✅ |
| R-5.2 | Content: Who We Are, Vision, Mission. | S2, S3 | ✅ |
| R-5.3 | **Why Choose Us** list from S3: end-to-end project execution · in-house design and manufacturing · premium materials · nationwide installation · tailor-made solutions · strict quality control. | S3 | 🟡 page currently shows the home "why choose" items instead |
| R-5.4 | Solutions: Architectural Signage, Road Safety Solutions, Custom Signage. | S2, S3 | ✅ |
| R-5.5 | Industries (12) + approach text. | S3 | ✅ (Q4) |
| R-5.6 | Manufacturing Excellence: Advanced Manufacturing text, 12 capabilities, quality statement. | S3 | ✅ |
| R-5.7 | Our Process: 5 steps (Discovery, Design, Manufacturing, Installation, Support). | S3 | ✅ |

## 6. Projects

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-6.1 | "Project Portfolio" with the S3 intro text. | S2, S3 | ✅ |
| R-6.2 | Executed work grouped by category; photos open full size. | S1 | ✅ |
| R-6.3 | Named projects (e.g. CCI Residential Tower, Kandivali) with their own pages, managed in admin. | S1 | ✅ (none entered yet) |
| R-6.4 | CTA "Have a project in mind? Let's create a signage solution tailored to your space." | S3 | ✅ (footer + CTA) |
| R-6.5 | Galleries must look orderly (feedback: "photo gallery is all over the place"). | S4 | ✅ even square grid, 9 + "Show all" |

## 7. Contact and enquiries

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-7.1 | "Get in Touch" page with the S3 intro text. | S3 | ✅ |
| R-7.2 | Form fields: Name, Company, Email, Phone, Project Location, Requirement, Message. | S2, S3 | ✅ |
| R-7.3 | CTA labels: Request a Consultation / Get a Quote. | S3 | ✅ |
| R-7.4 | Proper validation "like a senior full-stack developer", with the same rules on browser and server. | S4 | ✅ |
| R-7.5 | Every lead is stored (DB) and the sales team is notified by email. Never show success if the lead was lost. | S5 | ✅ (email needs Resend keys) |
| R-7.6 | Spam protection: honeypot, time trap, rate limit, Turnstile. | S5 | ✅ (Turnstile needs keys) |
| R-7.7 | Phone, email, WhatsApp, address and map shown once the client confirms them. | S2 | 🟡 not supplied |
| R-7.8 | Auto-reply email to the customer. | S5 (architecture §10.1) | ⬜ |

## 8. Admin panel

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-8.1 | Client uploads the banner images (desktop + mobile) themselves. | S3 | ⬜ |
| R-8.2 | Manage category text and photos (catalogue + executed), alt text, order, cover. | S1, S5 | 🟡 cover choice not used by the public site |
| R-8.3 | Manage projects, client logos, FAQs, site settings (contact, socials, founding year). | S5 | ✅ |
| R-8.4 | Enquiry inbox: status pipeline, owner, notes, CSV export. | S5 | ✅ |
| R-8.5 | Users with roles (Admin / Editor), audit log, secure login. | S5 | ✅ |

## 9. Motion

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-9.1 | Remove "fancy" animated sections that non-technical users won't understand. | S1 | ✅ (no marquee / sliders) |
| R-9.2 | Animation quality "up to mark": entrances like the Branding Agency demo. | S4 | ✅ |
| R-9.3 | Scroll animation "exactly" like the demo's Services page (photo drift, wipes, list swing-in). | S4 | ✅ |
| R-9.4 | Visitors with reduced-motion settings see no animation; content is never hidden without JS. | S5 | ✅ |

## 10. Non-functional

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-10.1 | Accessibility: WCAG 2.1 AA (contrast, keyboard, labels, focus). | S5 | ✅ (axe: 0 violations once animations settle) |
| R-10.2 | Performance: Lighthouse mobile ≥ 90; LCP ≤ 2.5 s on production. | S5 | 🟡 93–95 measured; LCP to confirm on the live CDN |
| R-10.3 | SEO: metadata, canonical URLs, sitemap, robots, structured data. | S5 | ✅ |
| R-10.4 | Security headers, no secrets in the repo, admin protected. | S5 | ✅ (rotate credentials shared in chat) |
| R-10.5 | Privacy: no raw IPs, data retention, a privacy policy. | S5 | 🟡 policy is a draft |
| R-10.6 | Content editable without redeploys (admin changes appear on the site). | S5 | ✅ for DB content; ⬜ for long-form copy |
| R-10.7 | Hosting suitable for commercial use, on the client's own domain. | S5 | ⬜ Vercel Pro + domain |

---

## 11. Open questions for the client

| # | Question | Why it matters |
|---|---|---|
| **Q1** | The updated doc's home page has **no product grid**, and it moves FAQs to the end of Home. In the meeting you said "my products is most important" and asked for the grid right after the About text. Keep the product grid on Home? **Recommendation:** keep it straight after About, then follow the doc's order. | Decides the whole home layout |
| **Q2** | Home About text: the doc has two paragraphs; the meeting asked for 1–2 lines. Use the full two paragraphs? | Length of the first screen |
| **Q3** | Please confirm the **founding year**. 2016 (IndiaMART) currently drives the "10+ years" badge. | We must not publish unconfirmed facts |
| **Q4** | Industry names differ between Home and About ("Manufacturing Facilities" vs "Industrial Facilities", "Government & Infrastructure Projects" vs "Government & Infrastructure"). Which wording? | One list is used everywhere |
| **Q5** | Fire & Safety Signs: the Overview repeats the Applications list. Please send the intended Overview. | Placeholder text is live |
| **Q6** | Please send: official logo (SVG), contact phone/email/WhatsApp/address/map, client logos, catalogue PDF or images, photos for Braille and Emergency Lights, high-res photos. | Several sections stay hidden until then |
| **Q7** | Should the vertical label also be removed from the inner-page heroes (About, Solutions…), or only from the Home banner? | S3 mentions the home banner only |
