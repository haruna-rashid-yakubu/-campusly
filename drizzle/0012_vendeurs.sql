-- Written by hand, like 0010 and 0011: only the new tables, guarded to replay safely.

CREATE TABLE IF NOT EXISTS "vendeur" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nom" text NOT NULL,
	"categorie" text NOT NULL,
	"accroche" text,
	"whatsapp" text NOT NULL,
	"livraison" text,
	"frais_livraison" integer DEFAULT 0 NOT NULL,
	"horaires" text,
	"video_url" text,
	"video_poster_url" text,
	"actif" boolean DEFAULT false NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendeur_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendeur_formule" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendeur_id" integer NOT NULL REFERENCES "vendeur"("id") ON DELETE cascade,
	"nom" text NOT NULL,
	"taille" integer NOT NULL,
	"prix" integer NOT NULL,
	"prix_barre" integer,
	"badge" text,
	"actif" boolean DEFAULT true NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendeur_article" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendeur_id" integer NOT NULL REFERENCES "vendeur"("id") ON DELETE cascade,
	"nom" text NOT NULL,
	"description" text,
	"photo_url" text,
	"en_rupture" boolean DEFAULT false NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commande_evenement" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendeur_id" integer NOT NULL REFERENCES "vendeur"("id") ON DELETE cascade,
	"type" text NOT NULL,
	"device_id" text NOT NULL,
	"classe_id" integer REFERENCES "classe"("id") ON DELETE set null,
	"reference" text,
	"nb_articles" integer,
	"total" integer,
	"detail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commande_evenement_vendeur" ON "commande_evenement" USING btree ("vendeur_id","created_at");
