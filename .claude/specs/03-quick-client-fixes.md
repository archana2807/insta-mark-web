# Spec — Task 03 `03-quick-client-fixes`

Website looks different: **yes** (show the client).

## Why

The client's review (S3, S5) asked for four fixes. Two are visible today:

- The vertical "Signage · Wayfinding · Road Safety" label on the home banner (R-3.4).
- A "10+ years" badge built from an unconfirmed founding year (2016, from IndiaMART) (R-1.5).

The About "Why Choose Us" shows the home list, not the six items from the client's About text (R-5.3). The cover photo chosen in admin is ignored by the public site (R-8.2).

## What changes

1. **Home banner:** the vertical side label is removed. Inner-page heroes keep theirs until question 7 is answered (1-PROJECT §11).
2. **Founding-year badge:** the `/content` default founding year becomes `null` (unconfirmed). The badge and the JSON-LD `foundingDate` show only when an admin enters the year in Settings, as today.
   - The seed never overwrites settings, so a database that already holds 2016 keeps showing the badge until an admin clears the field in Settings → Company. No live data is changed by this task.
3. **About "Why Choose Us":** shows the six items from the client's About text (`about.whyChooseUs` in `content/company.js`, R-5.3). The client gave titles only, so no description lines are added (no invented text). `RowList` hides the empty line.
4. **Category cover (R-8.2):** the cover chosen in admin (`categories.hero_image_id`) is the first photo on:

   - the category hero,
   - the home product grid (and "related solutions" cards),
   - the Solutions page rows.

   Without a cover, the old fallback is kept: first executed photo, else first catalogue photo. Changing or removing a cover refreshes the cached category list.

## Done when

1. The home banner has no vertical side label.
2. The "years" badge is hidden while no founding year is set; it shows when an admin sets one.
3. About "Why Choose Us" shows exactly the six client items.
4. A cover chosen in admin is the photo shown on the category hero, the home product grid and the Solutions page.
5. E2E tests cover these four changes; all other tests stay green.

## NOT in this task

- Inner-page vertical labels (question 7). Founding year value (question 3).
- Editing the live database.
