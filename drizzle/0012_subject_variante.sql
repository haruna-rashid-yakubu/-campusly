-- Additive: one nullable column. Null is the normal case and reads exactly
-- as the table does today, so no existing row changes meaning.
ALTER TABLE "subject" ADD COLUMN IF NOT EXISTS "variante" text;
