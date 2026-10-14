-- Written by hand, like 0020: a wide photo for the home screen's "À la une"
-- card. Null: the shop is not featured there. Guarded to replay safely.

ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "une_image" text;
