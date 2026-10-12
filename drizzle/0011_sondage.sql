-- Written by hand, like 0010: the journal has drifted from the live database,
-- so this holds only the two new tables and is guarded to replay safely.

CREATE TABLE IF NOT EXISTS "sondage" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"ferme_le" timestamp NOT NULL,
	"appareils_notifies" integer,
	"cree_par" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sondage_reponse" (
	"id" serial PRIMARY KEY NOT NULL,
	"sondage_id" integer NOT NULL,
	"device_id" text NOT NULL,
	"option" integer NOT NULL,
	"classe_id" integer,
	"repond_a" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sondage_reponse_appareil" UNIQUE("sondage_id","device_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "sondage_reponse" ADD CONSTRAINT "sondage_reponse_sondage_id_sondage_id_fk"
		FOREIGN KEY ("sondage_id") REFERENCES "public"."sondage"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "sondage_reponse" ADD CONSTRAINT "sondage_reponse_classe_id_classe_id_fk"
		FOREIGN KEY ("classe_id") REFERENCES "public"."classe"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
