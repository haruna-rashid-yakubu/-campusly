-- Written by hand, like 0022: what a restaurant has run out of today, set by
-- the vendor from their link. Holds the day it was set for, so it lapses by
-- itself the next morning. Guarded to replay safely.

ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "epuises" jsonb;
