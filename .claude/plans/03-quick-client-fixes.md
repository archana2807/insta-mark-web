# Plan — Task 03 `03-quick-client-fixes`

Spec: `.claude/specs/03-quick-client-fixes.md`.

## Files

| Change                     | Files                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove home vertical label | `src/components/sections/HomeHero.jsx`, `src/styles/_sections.scss` (unused `.hero-split__vertical` rules)                                                                                                                                        |
| Founding year unconfirmed  | `content/site.js` (`establishedYear: null`)                                                                                                                                                                                                       |
| About "Why Choose Us"      | `src/server/modules/page-sections/page-section.service.js`, `src/components/sections/RowList.jsx` (no empty `<p>`)                                                                                                                                |
| Admin cover on the site    | `category.repository.js` (select the cover asset), `category.service.js` (`cover`, `getCategoryPhotos`), `page-section.service.js` (hero photos), `src/app/(site)/solutions/page.js`, `media.service.js` (refresh category list on cover changes) |
| Tests                      | `tests/e2e/client-fixes.spec.js` (new, runs last)                                                                                                                                                                                                 |

## Decisions

| Topic                    | Choice                                                                          | Why                                                                        |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Inner-page labels        | Kept                                                                            | Question 7 is open                                                         |
| Live DB founding year    | Not touched; you clear it in admin Settings                                     | AGENTS: never change production data by hand; settings belong to the admin |
| Why Choose Us text lines | Titles only                                                                     | Client gave titles only (R-1.5: never invent)                              |
| Cover fallback           | First executed, then first catalogue (as today)                                 | Same look when no cover is chosen                                          |
| Cover test               | Set a different cover through the real admin UI; check all three pages; restore | Proves the R-8.2 flow end to end                                           |

## Steps

1. Code changes above. 2. E2E spec. 3. Lint, unit, check:content, build, full e2e. 4. Tick task 03, commit.
