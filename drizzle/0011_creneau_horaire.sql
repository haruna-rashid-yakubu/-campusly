-- Additive: one nullable column. Null keeps today's behaviour exactly, so
-- every existing row reads the same until it is given a value.
ALTER TABLE "creneau" ADD COLUMN IF NOT EXISTS "horaire" text;
