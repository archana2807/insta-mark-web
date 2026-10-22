-- Content fix (client, 22 Oct 2026): the Fire & Safety Signs overview must read word for
-- word like the client's content document. The earlier text had an opening sentence the
-- document does not have. Only the exact old text is replaced, so an overview edited in
-- the admin panel is never overwritten.
UPDATE "categories"
SET "overview" = 'Industrial plants, factories, warehouses, hospitals, hotels, shopping malls, commercial buildings, educational institutions, residential complexes, and public infrastructure for emergency preparedness.'
WHERE "slug" = 'fire-safety-signs'
  AND "overview" = 'Fire & safety signage for emergency preparedness across industrial plants, factories, warehouses, hospitals, hotels, shopping malls, commercial buildings, educational institutions, residential complexes, and public infrastructure.';
