-- Loyalty card and vendor confirmation link. Additive and guarded.
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "fidelite" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendeur" ADD COLUMN IF NOT EXISTS "token_espace" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vendeur_token_espace_unique" ON "vendeur" ("token_espace");
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "user_id" text REFERENCES "user"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "statut" text;
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "statut_le" timestamp;
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "rang" integer;
--> statement-breakpoint
ALTER TABLE "commande_evenement" ADD COLUMN IF NOT EXISTS "recompense" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commande_evenement_user" ON "commande_evenement" ("user_id","vendeur_id");
--> statement-breakpoint
UPDATE "vendeur" SET "fidelite" = true, "token_espace" = replace(gen_random_uuid()::text, '-', '') WHERE "slug" = 'bronuts' AND "token_espace" IS NULL;
