# CLAUDE.md — Insta Mark website

Read [README.md](README.md), [docs/architecture.md](docs/architecture.md) and [docs/database-design.md](docs/database-design.md) before making changes.

## Hard rules

- **JavaScript only.** No TypeScript files, no type annotations, no `.ts`/`.tsx` config.
- **UI = Bootstrap 5.3 + React-Bootstrap + SCSS.** Never add Tailwind/shadcn. Never import `bootstrap.bundle.js` — interactive pieces come from React-Bootstrap inside `"use client"` components.
- **Design reference** is the Crafto “Branding Agency” demo, recreated in our own code. Do not copy theme CSS/JS/images.
- **Client brief:** white background, simple, picture-heavy, minimal animation (users are site/procurement staff). Don’t add carousels, parallax, 3D tilt or marquees.
- **Never invent client facts** (phone numbers, addresses, client names/logos, stats, testimonials, promises like response times). Leave them `null` in `content/site.js` or mark `TODO(client)`; components hide unset values.

## Architecture conventions

- Pages read data **only** via `lib/data/index.js` (async). It uses `db-source.js` (Prisma, cached with tags) when `DATABASE_URL` is set and `content-source.js` (`/content`) otherwise — keep both sources returning the same shapes.
- Never use `export const dynamicParams = false` on ISR pages: after `revalidateTag()` Next.js 15 throws NoFallbackError and serves 404. Use `notFound()` for unknown slugs instead.
- Any write to the database (admin panel) must call `revalidateTag()` with the matching tags from `lib/data/tags.js`, otherwise the static pages keep showing old data.
- Integrations are env-gated and must stay optional (see README → Configuration). Turnstile: block on a rejected token, accept on Cloudflare outage (ADR-10).
- Server components by default; `"use client"` only for interactive leaves (Header, Gallery, FaqSection, EnquiryForm, Reveal).
- Forms post to server actions in `lib/actions/`, validated with Zod schemas in `lib/validation/`. Order for leads: validate → save to DB → email. Never report success in production if the lead was not stored or sent.
- Database changes: edit `prisma/schema.prisma`, run `npm run db:migrate -- --name <change>`; never edit an applied migration. Update `docs/database-design.md` too.
- Styles: tokens in `styles/_variables.scss`; components in `_components.scss`, layout in `_layout.scss`, sections in `_sections.scss`. Keep WCAG AA contrast (body text `#5f5e5e`, darker gradient stops).
- Icons: no icon font. Server components use `<Icon name="…" />`, client components use `<ClientIcon />` (small subset). To add an icon, add its name to `scripts/build-icons.js` and run `npm run icons` (generated files are committed). CSS pseudo-element icons use the `css-icon` mixin.
- Accessibility: keep WCAG AA — use `$muted` (not lighter greys) for secondary text.
- Images: add files under `public/images/work/<category>/`, register them in `content/gallery.js` with real width/height and descriptive alt text, then run `npm run check:content`.

## Before you finish a change

1. `npm run check:content`
2. `npm run build` — must pass with no warnings
3. Check the page in a browser at desktop and 390px width (no horizontal scroll, no console errors)
