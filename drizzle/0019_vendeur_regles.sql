-- Written by hand, like 0018: what one item of a shop is called, the colour
-- behind its logo, its own loyalty card, and what it pays Campusly. All nullable, so existing shops keep their behaviour: no rule is
-- Bronuts' card, no billing is nothing billed. Guarded to replay safely.

ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "fidelite_regle" jsonb;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "facturation" text;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "forfait_mensuel" integer;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "commission_par_article" integer;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "minimum_mensuel" integer;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "unite" text;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "logo_fond" text;
