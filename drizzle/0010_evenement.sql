-- Written by hand rather than generated.
--
-- The journal has drifted from the live database: earlier schema changes were
-- applied with `drizzle-kit push`, so a generated file re-creates tables that
-- are already there and fails on the first one. This holds only the table that
-- production actually lacks, and is guarded so it can be replayed safely.

CREATE TABLE IF NOT EXISTS "evenement" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"cible" text NOT NULL,
	"cible_id" integer,
	"canal" text,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "evenement" ADD CONSTRAINT "evenement_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evenement_cible" ON "evenement" USING btree ("cible","cible_id");
