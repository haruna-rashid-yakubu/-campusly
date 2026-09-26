import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  serial,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Auth.js tables (shape required by @auth/drizzle-adapter) -------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role", { enum: ["etudiant", "admin"] })
    .notNull()
    .default("etudiant"),
  // The promo the student picked. It used to live only in a cookie, which the
  // server cannot read when it wakes up at 20h to send tomorrow's schedule —
  // it would see nothing but anonymous rows.
  classeId: integer("classe_id").references(() => classes.id, { onDelete: "set null" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// --- Domain tables ----------------------------------------------------------

export const classes = pgTable("classe", {
  id: serial("id").primaryKey(),
  label: text("label").notNull().unique(), // e.g. "BME · L2"
});

export const subjectTypeEnum = ["Partiel", "Examen", "Rattrapage", "TD"] as const;

export const subjects = pgTable("subject", {
  id: serial("id").primaryKey(),
  matiere: text("matiere").notNull(),
  filiere: text("filiere").notNull(),
  niveau: text("niveau").notNull(),
  annee: text("annee").notNull(),
  type: text("type", { enum: subjectTypeEnum }).notNull(),
  corrige: boolean("corrige").notNull().default(false),
  enseignant: text("enseignant"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  correctionUrl: text("correction_url"),
  correctionName: text("correction_name"),
  downloads: integer("downloads").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const submissionStatusEnum = ["en_attente", "publie", "refuse"] as const;

export const subjectSubmissions = pgTable("subject_submission", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matiere: text("matiere").notNull(),
  filiere: text("filiere").notNull(),
  niveau: text("niveau").notNull(),
  annee: text("annee").notNull(),
  type: text("type", { enum: subjectTypeEnum }).notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  status: text("status", { enum: submissionStatusEnum })
    .notNull()
    .default("en_attente"),
  note: text("note"),
  publishedSubjectId: integer("published_subject_id").references(
    () => subjects.id
  ),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
});

export const cites = pgTable("cite", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  quartier: text("quartier").notNull(),
  distanceM: integer("distance_m").notNull(),
  description: text("description").notNull().default(""),
  verified: boolean("verified").notNull().default(true),
  whatsapp: text("whatsapp").notNull().default(""),
  photos: text("photos").array().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const roomTypes = pgTable("room_type", {
  id: serial("id").primaryKey(),
  citeId: integer("cite_id")
    .notNull()
    .references(() => cites.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Chambre simple / Studio / Appartement
  surface: text("surface").notNull(), // "9 m²"
  prixMensuel: integer("prix_mensuel").notNull(),
  stock: integer("stock").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pressings = pgTable("pressing", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  quartier: text("quartier").notNull(),
  distanceLabel: text("distance_label").notNull(),
  badge: text("badge").notNull(),
  whatsapp: text("whatsapp").notNull(),
});

export const pressingTarifs = pgTable("pressing_tarif", {
  id: serial("id").primaryKey(),
  pressingId: integer("pressing_id")
    .notNull()
    .references(() => pressings.id, { onDelete: "cascade" }),
  article: text("article").notNull(),
  prix: integer("prix").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pushSubscriptions = pgTable("push_subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  // Carried on the subscription as well as the user: user_id is nullable, so
  // someone who turned notifications on without ever signing in still has to
  // receive their own promo's programme and nobody else's.
  classeId: integer("classe_id").references(() => classes.id, { onDelete: "set null" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
 * One week of one promo. The photo of the sheet on the noticeboard stays —
 * it is the original, and it is what students trust — but a photo cannot be
 * read by a cron job at 20h, so the same week also carries a grid of slots.
 * Either half can exist alone: a week with only a photo still displays, a
 * week with only a grid still sends its reminders.
 */
export const programmePublications = pgTable(
  "programme_publication",
  {
    id: serial("id").primaryKey(),
    classeId: integer("classe_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    // The Monday. Stored separately from the label because "Semaine 25" is
    // the school's own counting, useless for working out what "tomorrow" is.
    semaine: date("semaine", { mode: "date" }).notNull(),
    photoUrl: text("photo_url"),
    weekLabel: text("week_label").notNull(), // "Semaine 25" / "Semaine du 4 au 9 mai"
    // The room named once in the header of the sheet; a slot may override it.
    salleDefaut: text("salle_defaut"),
    publishedAt: timestamp("published_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("programme_classe_semaine").on(t.classeId, t.semaine)]
);

export const momentEnum = ["matin", "apres_midi"] as const;

/*
 * A slot in the 12-cell grid: six days by two fixed blocks, 8h-12h and
 * 14h-18h. Only the subject varies, and a block can be empty — which is why
 * an empty block is simply the absence of a row rather than a flag.
 *
 * The hours are not stored. They never move, and keeping them as a constant
 * means the day the school shifts to 8h30 one line changes instead of a
 * semester of data.
 */
export const creneaux = pgTable(
  "creneau",
  {
    id: serial("id").primaryKey(),
    programmeId: integer("programme_id")
      .notNull()
      .references(() => programmePublications.id, { onDelete: "cascade" }),
    jour: integer("jour").notNull(), // 1 = lundi … 6 = samedi
    moment: text("moment", { enum: momentEnum }).notNull(),
    matiere: text("matiere").notNull(),
    enseignant: text("enseignant"),
    salle: text("salle"), // overrides salleDefaut when set — "Labo 1"
    // "(4/6)" on the sheet: which session of the course this is. It is what
    // makes "the CC is coming" knowable without anyone typing a date.
    seance: integer("seance"),
    seances: integer("seances"),
    // Set by hand when someone actually knows the CC falls here.
    cc: boolean("cc").notNull().default(false),
  },
  (t) => [unique("creneau_slot").on(t.programmeId, t.jour, t.moment)]
);

// --- Relations ---------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(subjectSubmissions),
}));

export const subjectSubmissionsRelations = relations(subjectSubmissions, ({ one }) => ({
  user: one(users, { fields: [subjectSubmissions.userId], references: [users.id] }),
  publishedSubject: one(subjects, {
    fields: [subjectSubmissions.publishedSubjectId],
    references: [subjects.id],
  }),
}));

export const citesRelations = relations(cites, ({ many }) => ({
  roomTypes: many(roomTypes),
}));

export const roomTypesRelations = relations(roomTypes, ({ one }) => ({
  cite: one(cites, { fields: [roomTypes.citeId], references: [cites.id] }),
}));

export const pressingsRelations = relations(pressings, ({ many }) => ({
  tarifs: many(pressingTarifs),
}));

export const pressingTarifsRelations = relations(pressingTarifs, ({ one }) => ({
  pressing: one(pressings, { fields: [pressingTarifs.pressingId], references: [pressings.id] }),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  publications: many(programmePublications),
}));

export const programmePublicationsRelations = relations(programmePublications, ({ one, many }) => ({
  classe: one(classes, { fields: [programmePublications.classeId], references: [classes.id] }),
  creneaux: many(creneaux),
}));

export const creneauxRelations = relations(creneaux, ({ one }) => ({
  programme: one(programmePublications, {
    fields: [creneaux.programmeId],
    references: [programmePublications.id],
  }),
}));
