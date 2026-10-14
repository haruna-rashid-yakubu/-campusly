-- Written by hand, like 0021: a restaurant's menu on the shop, and on each
-- order how it is handed over and where to say it is ready. Guarded to
-- replay safely.

ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "menu" jsonb;
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "mode" text;
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "push_endpoint" text;
