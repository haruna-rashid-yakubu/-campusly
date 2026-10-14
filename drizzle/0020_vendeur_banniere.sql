-- Written by hand, like 0019: each shop's own page-header backdrop (a CSS
-- background). Null keeps the pink stripes. Guarded to replay safely.

ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "banniere" text;
