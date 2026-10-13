-- Weekly delivery schedule for vendors. Additive and guarded.
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "livraison_jour" integer;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "limite_jour" integer;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "limite_heure" integer;
--> statement-breakpoint
UPDATE "vendeur" SET "livraison_jour" = 5, "limite_jour" = 4, "limite_heure" = 17, "horaires" = NULL WHERE "slug" = 'bronuts';
