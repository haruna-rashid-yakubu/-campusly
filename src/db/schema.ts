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
  /*
   * Per device, not per account: this is the thing that actually buzzes, and
   * someone may want the evening reminder on their phone and nothing on the
   * tablet. Both default to on — the person just asked for notifications.
   *
   * Only the promo-wide alerts are listed. "Ton sujet a été publié" answers
   * something the student did themselves and is not noise to be filtered.
   */
  prefProgramme: boolean("pref_programme").notNull().default(true),
  prefRappel: boolean("pref_rappel").notNull().default(true),
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
    /*
     * The two-hour slots this course occupies: 1 = 8h-10h, 2 = 10h-12h,
     * 3 = 14h-16h, 4 = 16h-18h. A course running 8h to 12h is one row with
     * debut 1 and fin 2 — one session, not two — while a morning split
     * between two courses is two rows, (1,1) and (2,2). Both shapes appear on
     * the real sheets, sometimes on the same one.
     */
    debut: integer("debut").notNull(),
    fin: integer("fin").notNull(),
    // Kept and still written, derived from `debut`. Nothing reads it any
    // more; it stays so this change can be undone without losing a week.
    moment: text("moment", { enum: momentEnum }).notNull(),
    matiere: text("matiere").notNull(),
    /*
     * What a notification calls this course. The screen keeps the official
     * title — "Introduction à l'analyse de données à l'aide d'un tableur" —
     * because that is what the noticeboard says and what students check
     * against; a push has room for "Analyse de données" and nothing more.
     * Empty means the title is short enough to send as it is.
     */
    abrege: text("abrege"),
    enseignant: text("enseignant"),
    salle: text("salle"), // overrides salleDefaut when set — "Labo 1"
    // "(4/6)" on the sheet: which session of the course this is. It is what
    // makes "the CC is coming" knowable without anyone typing a date.
    seance: integer("seance"),
    seances: integer("seances"),
    // Set by hand when someone actually knows the CC falls here.
    cc: boolean("cc").notNull().default(false),
  },
  (t) => [unique("creneau_slot").on(t.programmeId, t.jour, t.debut)]
);

/*
 * One row per device per day. Not per page view: the question is how many
 * people opened the app, and a row that merely counts higher answers it just
 * as well while keeping the table the size of the audience rather than the
 * size of its browsing.
 *
 * The device id is a cookie, which makes this a count of devices, not of
 * people — the same student on a phone and a laptop is two. No better proxy
 * exists without asking everyone to sign in, which would cost far more
 * readers than the precision is worth.
 */
export const visites = pgTable(
  "visite",
  {
    id: serial("id").primaryKey(),
    deviceId: text("device_id").notNull(),
    // The promo showing at the time, so the audience can be read per promo —
    // "who is actually using this" is a different question in each one.
    classeId: integer("classe_id").references(() => classes.id, { onDelete: "set null" }),
    jour: date("jour", { mode: "date" }).notNull(),
    ouvertures: integer("ouvertures").notNull().default(1),
    premiereVisite: boolean("premiere_visite").notNull().default(false),
    /*
     * Opened from the home screen rather than a browser tab. True for the day
     * as soon as it happens once, since the question is whether the device
     * has the app installed at all.
     *
     * On iOS the installed app generally keeps its own storage, so it carries
     * a different device id from the same phone's Safari: this counts
     * installed apps in use, not the share of students who installed.
     */
    standalone: boolean("standalone").notNull().default(false),
    vuA: timestamp("vu_a", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique("visite_device_jour").on(t.deviceId, t.jour)]
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
