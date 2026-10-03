CREATE TABLE "visite" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"classe_id" integer,
	"jour" date NOT NULL,
	"ouvertures" integer DEFAULT 1 NOT NULL,
	"premiere_visite" boolean DEFAULT false NOT NULL,
	"vu_a" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "visite_device_jour" UNIQUE("device_id","jour")
);
--> statement-breakpoint
ALTER TABLE "visite" ADD CONSTRAINT "visite_classe_id_classe_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."classe"("id") ON DELETE set null ON UPDATE no action;