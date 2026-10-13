-- Written by hand, like 0011: an alert about past papers held until a set
-- time, sent by the morning cron. Guarded to replay safely.

CREATE TABLE IF NOT EXISTS "notification_annales" (
	"id" serial PRIMARY KEY NOT NULL,
	"filiere" text NOT NULL,
	"niveau" text NOT NULL,
	"depuis" timestamp NOT NULL,
	"envoyer_apres" timestamp NOT NULL,
	"envoyee_le" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
