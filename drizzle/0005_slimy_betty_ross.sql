CREATE TABLE "creneau" (
	"id" serial PRIMARY KEY NOT NULL,
	"programme_id" integer NOT NULL,
	"jour" integer NOT NULL,
	"moment" text NOT NULL,
	"matiere" text NOT NULL,
	"enseignant" text,
	"salle" text,
	"seance" integer,
	"seances" integer,
	"cc" boolean DEFAULT false NOT NULL,
	CONSTRAINT "creneau_slot" UNIQUE("programme_id","jour","moment")
);
--> statement-breakpoint
ALTER TABLE "programme_publication" ALTER COLUMN "photo_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "programme_publication" ADD COLUMN "semaine" date NOT NULL;--> statement-breakpoint
ALTER TABLE "programme_publication" ADD COLUMN "salle_defaut" text;--> statement-breakpoint
ALTER TABLE "creneau" ADD CONSTRAINT "creneau_programme_id_programme_publication_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programme_publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_publication" ADD CONSTRAINT "programme_classe_semaine" UNIQUE("classe_id","semaine");