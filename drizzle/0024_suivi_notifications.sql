-- Written by hand, like 0022 and 0023: the hours each phone opened the app
-- (one bit per hour, Yaoundé time), and which notification brought someone
-- in. Guarded to replay safely.

ALTER TABLE "visite" ADD COLUMN IF NOT EXISTS "heures" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "notification_envoi" ADD COLUMN IF NOT EXISTS "cle" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_clic" (
	"id" serial PRIMARY KEY NOT NULL,
	"cle" text NOT NULL,
	"device_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_clic_unique" UNIQUE("cle","device_id")
);
