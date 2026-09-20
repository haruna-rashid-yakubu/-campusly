CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "cite" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"quartier" text NOT NULL,
	"distance_m" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"photos" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classe" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "classe_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "pressing_tarif" (
	"id" serial PRIMARY KEY NOT NULL,
	"pressing_id" integer NOT NULL,
	"article" text NOT NULL,
	"prix" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pressing" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"quartier" text NOT NULL,
	"distance_label" text NOT NULL,
	"badge" text NOT NULL,
	"whatsapp" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programme_publication" (
	"id" serial PRIMARY KEY NOT NULL,
	"classe_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"week_label" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"cite_id" integer NOT NULL,
	"type" text NOT NULL,
	"surface" text NOT NULL,
	"prix_mensuel" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"matiere" text NOT NULL,
	"filiere" text NOT NULL,
	"niveau" text NOT NULL,
	"annee" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text,
	"file_name" text,
	"status" text DEFAULT 'en_attente' NOT NULL,
	"note" text,
	"published_subject_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" serial PRIMARY KEY NOT NULL,
	"matiere" text NOT NULL,
	"filiere" text NOT NULL,
	"niveau" text NOT NULL,
	"annee" text NOT NULL,
	"type" text NOT NULL,
	"corrige" boolean DEFAULT false NOT NULL,
	"file_url" text,
	"file_name" text,
	"downloads" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" text DEFAULT 'etudiant' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pressing_tarif" ADD CONSTRAINT "pressing_tarif_pressing_id_pressing_id_fk" FOREIGN KEY ("pressing_id") REFERENCES "public"."pressing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_publication" ADD CONSTRAINT "programme_publication_classe_id_classe_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."classe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type" ADD CONSTRAINT "room_type_cite_id_cite_id_fk" FOREIGN KEY ("cite_id") REFERENCES "public"."cite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_submission" ADD CONSTRAINT "subject_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_submission" ADD CONSTRAINT "subject_submission_published_subject_id_subject_id_fk" FOREIGN KEY ("published_subject_id") REFERENCES "public"."subject"("id") ON DELETE no action ON UPDATE no action;