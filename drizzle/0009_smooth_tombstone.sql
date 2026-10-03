ALTER TABLE "creneau" DROP CONSTRAINT "creneau_slot";--> statement-breakpoint
ALTER TABLE "creneau" ADD COLUMN "debut" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "creneau" ADD COLUMN "fin" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "visite" ADD COLUMN "standalone" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creneau" ADD CONSTRAINT "creneau_slot" UNIQUE("programme_id","jour","debut");