import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
  primaryKey,
  serial,
  date,
  unique,
  jsonb,
  type AnyPgColumn,
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
  /*
   * The promo this one shares its week with. At the UCAC a tronc commun is
   * the rule rather than the exception — the whole first year of LEG, GRH,
   * LSSD and LQSSE sits in the same room — and the timetable was being
   * duplicated per promo to express it. A copy drifts: the day a room moves
   * on the original, every promo holding a copy keeps sending its students
   * to the old one, and nobody finds out until they are standing in it.
   *
   * Null is the normal case: the promo publishes its own week. Resolution is
   * deliberately one hop, so a chain cannot form and a cycle cannot hang the
   * page — a follower must point at a promo that publishes.
   */
  programmeDe: integer("programme_de").references((): AnyPgColumn => classes.id, {
    onDelete: "set null",
  }),
});

/*
 * Which promos sit the same papers.
 *
 * At the UCAC a tronc commun narrows as the licence goes on: in L1 the whole
 * of LEG, GRH, LSSD and LQSSE sit the same exams; in L2 LEG has left and the
 * other three remain; by L3 every filière sets its own. So the sharing is a
 * fact about a (filière, niveau) pair, never about a filière as a whole — a
 * paper sent for LEG L1 belongs to GRH L1 too, while one sent for LEG L3 must
 * not leave LEG.
 *
 * Pairs carrying the same `groupe` see each other's papers. A pair with no
 * row keeps its papers to itself, which is the safe default: a promo that
 * sees too few is inconvenienced, one that sees another filière's exam is
 * misled about what it will be asked.
 */
export const partagesEpreuve = pgTable(
  "partage_epreuve",
  {
    filiere: text("filiere").notNull(),
    niveau: text("niveau").notNull(),
    groupe: text("groupe").notNull(),
  },
  (t) => [primaryKey({ columns: [t.filiere, t.niveau] })]
);

export const subjectTypeEnum = ["Partiel", "Examen", "Rattrapage", "TD"] as const;

export const subjects = pgTable("subject", {
  id: serial("id").primaryKey(),
  matiere: text("matiere").notNull(),
  filiere: text("filiere").notNull(),
  niveau: text("niveau").notNull(),
  annee: text("annee").notNull(),
  type: text("type", { enum: subjectTypeEnum }).notNull(),
  corrige: boolean("corrige").notNull().default(false),
  /*
   * Keeps this paper inside its own filière even where the promos otherwise
   * share. L1 is a tronc commun with one exception the faculty makes every
   * year: the maths paper differs per filière, while the course is the same.
   * Without the exception a GRH student would revise on LEG's maths exam.
   */
  reserveFiliere: boolean("reserve_filiere").notNull().default(false),
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
  prefAnnales: boolean("pref_annales").notNull().default(true),
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
    // Who pressed publish. A promo that turns up in the wrong room needs a
    // name to ask, not a row that appeared by itself.
    publiePar: text("publie_par"),
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

/*
 * A délégué: one student trusted with one promo's timetable and past papers.
 *
 * Kept as its own table rather than a third value in `user.role`, for two
 * reasons. A délégué's power is not "more account", it is "this promo" — the
 * row carries the scope, and a second row is how one person covers two promos
 * when a tronc commun calls for it. And the invitation can be written before
 * the person has ever signed in: the match is made on the e-mail Google gives
 * back, so naming a délégué never has to wait for them to create an account.
 *
 * Removing the row removes the power, immediately and with no trace left on
 * the student's own account.
 */
export const delegations = pgTable(
  "delegation",
  {
    id: serial("id").primaryKey(),
    // Lower-cased on the way in; Google hands back the address as the person
    // typed it, and "Jean.Mbarga@" must not become a second délégué.
    email: text("email").notNull(),
    classeId: integer("classe_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    // Who named them, kept so a right nobody remembers granting can be traced.
    nommePar: text("nomme_par"),
    // When the person was actually told on their phone. Null means the news is
    // still waiting: they had no device registered when they were named, and
    // the alert is delivered the moment they switch notifications on.
    notifieeAt: timestamp("notifiee_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique("delegation_email_classe").on(t.email, t.classeId)]
);

export const delegationsRelations = relations(delegations, ({ one }) => ({
  classe: one(classes, { fields: [delegations.classeId], references: [classes.id] }),
}));

/*
 * A week's timetable, photographed by whoever got to the noticeboard first.
 *
 * The board is posted on campus and read by everyone; the bottleneck has
 * never been knowing what it says, only getting it into the app. So a student
 * sends the photo and the promo's délégué — or an admin — turns it into the
 * published week. The proposal carries no grid: asking a student to retype
 * twelve cells is how you get no proposals at all.
 */
export const propositionStatusEnum = ["en_attente", "publie", "refuse"] as const;

export const programmePropositions = pgTable("programme_proposition", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  classeId: integer("classe_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  // The Monday of the week on the sheet.
  semaine: date("semaine", { mode: "date" }).notNull(),
  photoUrl: text("photo_url").notNull(),
  note: text("note"),
  status: text("status", { enum: propositionStatusEnum })
    .notNull()
    .default("en_attente"),
  // Who answered, and what they said back.
  reponsePar: text("reponse_par"),
  reponseNote: text("reponse_note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
});

export const programmePropositionsRelations = relations(programmePropositions, ({ one }) => ({
  user: one(users, { fields: [programmePropositions.userId], references: [users.id] }),
  classe: one(classes, { fields: [programmePropositions.classeId], references: [classes.id] }),
}));

/*
 * What was sent, to whom, and how many phones it actually reached.
 *
 * A push leaves no trace of its own: it either rings or it does not, and the
 * person who sent it has no way of telling the difference afterwards. That is
 * a bad place to be when the whole promo is waiting on the week's timetable —
 * "did it go out?" became a question only the database could answer, and only
 * by inference. Now it answers directly.
 *
 * The count is of devices the push service accepted, not of people who read
 * it: nobody can know that. It is still the number that matters, because zero
 * means the message rang nowhere.
 */
export const notificationTypeEnum = [
  "programme",
  "rappel",
  "admin",
  "delegue",
  "delegation",
  "etudiant",
  "annales",
  "test",
  "tous",
] as const;

export const notificationEnvois = pgTable("notification_envoi", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: notificationTypeEnum }).notNull(),
  // The promo concerned, when the send was aimed at one.
  classeId: integer("classe_id").references(() => classes.id, { onDelete: "set null" }),
  titre: text("titre").notNull(),
  corps: text("corps").notNull(),
  // Devices the push service accepted, and devices it was offered to.
  atteints: integer("atteints").notNull().default(0),
  vises: integer("vises").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const notificationEnvoisRelations = relations(notificationEnvois, ({ one }) => ({
  classe: one(classes, { fields: [notificationEnvois.classeId], references: [classes.id] }),
}));

// --- What Campusly actually caused ------------------------------------------

/*
 * Actions worth counting, as opposed to page views.
 *
 * `contact_bailleur` is the tap on "Contacter sur WhatsApp" on a cité. It is
 * the closest thing the app can honestly witness to a student arriving at a
 * landlord's door: what happens after the tap takes place in WhatsApp, and
 * then on a dirt road, where no code of ours can follow. Every screen that
 * shows these figures has to say so, because the number will be quoted to the
 * landlord, and a bailleur told "fifteen clients" who met three stops
 * believing anything Campusly says afterwards.
 *
 * `partage` is someone passing the app on.
 */
export const evenementTypeEnum = ["contact_bailleur", "partage"] as const;

/** What the event is about. `app` is Campusly itself, shared from anywhere. */
export const evenementCibleEnum = ["cite", "app"] as const;

export const evenements = pgTable(
  "evenement",
  {
    id: serial("id").primaryKey(),
    type: text("type", { enum: evenementTypeEnum }).notNull(),
    cible: text("cible", { enum: evenementCibleEnum }).notNull(),
    /*
     * Deliberately not a foreign key. A cité that is deleted must not take its
     * history with it: "this cité received eleven contacts before we dropped
     * it" is exactly the kind of thing worth keeping, and a cascade would
     * erase the evidence along with the row.
     */
    cibleId: integer("cible_id"),
    /** For a share: which route was used (statut, systeme, whatsapp, copie). */
    canal: text("canal"),
    /*
     * Who did it, when they were signed in. Contacting a landlord is behind
     * the sign-in gate, so contacts always have one; a share does not, and
     * null there means an anonymous device, not a missing row.
     *
     * It is kept so that "people" can be told apart from "taps" — eleven taps
     * by one student looking for the number again is not eleven students. No
     * screen shows who; the name is never the point.
     */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("evenement_cible").on(t.cible, t.cibleId)]
);

export const evenementsRelations = relations(evenements, ({ one }) => ({
  user: one(users, { fields: [evenements.userId], references: [users.id] }),
}));

// --- Sondages ----------------------------------------------------------------

/*
 * A question put to every student at once, answered in one tap.
 *
 * One at a time: the home screen shows the open one, and two side by side
 * would each get half the attention and neither a clear answer. Opening a new
 * one is refused while another is still open, rather than silently closing it.
 */
export const sondages = pgTable("sondage", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  // Two to four labels, in display order. An answer stores the index.
  options: jsonb("options").$type<string[]>().notNull(),
  fermeLe: timestamp("ferme_le", { mode: "date" }).notNull(),
  // Devices the push actually reached, or null when it went out silently.
  appareilsNotifies: integer("appareils_notifies"),
  creePar: text("cree_par"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
 * One answer per device, changeable while the poll is open.
 *
 * Keyed on the same anonymous device cookie as the visit counter, not on the
 * account: most students answer without signing in, and asking them to would
 * cost more answers than it would protect. No name is kept; the promo is only
 * there so the result can be read per promo.
 */
export const sondageReponses = pgTable(
  "sondage_reponse",
  {
    id: serial("id").primaryKey(),
    sondageId: integer("sondage_id")
      .notNull()
      .references(() => sondages.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    option: integer("option").notNull(),
    classeId: integer("classe_id").references(() => classes.id, { onDelete: "set null" }),
    repondA: timestamp("repond_a", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique("sondage_reponse_appareil").on(t.sondageId, t.deviceId)]
);

// --- Vendeurs (section Commander) -----------------------------------------

/*
 * A shop students can order from. The order itself is finished on WhatsApp,
 * with the vendor; Campusly shows the catalogue, prepares the message and
 * counts what it sent their way.
 *
 * Inactive vendors are visible to admins only, so a new shop can be filled
 * and checked on a real phone before any student sees it.
 */
export const vendeurs = pgTable("vendeur", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nom: text("nom").notNull(),
  categorie: text("categorie").notNull(), // "manger", "service"…
  accroche: text("accroche"),
  // Wide wordmark for the page header, square version for the list.
  logoUrl: text("logo_url"),
  logoCarreUrl: text("logo_carre_url"),
  // The wordmark's own background (#rrggbb), behind it in the header. Null: black.
  logoFond: text("logo_fond"),
  // The page header's own backdrop, a CSS background. Null: Bronuts' pink stripes.
  banniere: text("banniere"),
  // A wide photo for the home screen's "À la une" card. Null: the shop is not featured there.
  uneImage: text("une_image"),
  whatsapp: text("whatsapp").notNull(), // digits only, with country code
  livraison: text("livraison"),
  // Added once per order, not per pack: one trip across campus.
  fraisLivraison: integer("frais_livraison").notNull().default(0),
  // Weekly delivery: the day it happens and the last moment to order for it
  // (1 = Monday … 7 = Sunday, hour in Cameroon time). All null = no schedule.
  livraisonJour: integer("livraison_jour"),
  limiteJour: integer("limite_jour"),
  limiteHeure: integer("limite_heure"),
  horaires: text("horaires"),
  // A short clip shown at the top of the page, muted and looping.
  videoUrl: text("video_url"),
  videoPosterUrl: text("video_poster_url"),
  actif: boolean("actif").notNull().default(false),
  ordre: integer("ordre").notNull().default(0),
  // What one item of a pack is called, singular ("bouteille"). Null: "donut".
  unite: text("unite"),
  // The Campusly loyalty card (see lib/fidelite.ts) applies to this shop.
  fidelite: boolean("fidelite").notNull().default(false),
  // The shop's own card: { cycle, icone, paliers: [{ rang, cle, libelle, icone }] }.
  // Null keeps the first card, Bronuts'.
  fideliteRegle: jsonb("fidelite_regle"),
  /*
   * What the shop pays Campusly. "forfait": a flat monthly fee. "commission":
   * so much per item sold through the app, with a monthly minimum paid in
   * advance at the start of the month — the balance is settled with the next
   * month's advance. Null: nothing billed (the pressing, a trial).
   */
  facturation: text("facturation", { enum: ["forfait", "commission"] }),
  forfaitMensuel: integer("forfait_mensuel"),
  commissionParArticle: integer("commission_par_article"),
  minimumMensuel: integer("minimum_mensuel"),
  /*
   * The secret in the vendor's own link, /vendeur/<token>, where they mark
   * orders delivered. A link rather than an account: the vendor keeps one
   * bookmark and never a password. Regenerated from the admin if it leaks.
   */
  tokenEspace: text("token_espace").unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/*
 * What is sold: a pack of a set size, composed by the student from the
 * vendor's flavours. The price lives here and is re-read on the server when
 * the order is prepared — the client's total is never trusted.
 */
export const vendeurFormules = pgTable("vendeur_formule", {
  id: serial("id").primaryKey(),
  vendeurId: integer("vendeur_id")
    .notNull()
    .references(() => vendeurs.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  taille: integer("taille").notNull(),
  prix: integer("prix").notNull(),
  // The vendor's usual price, when Campusly students get a better one. Shown
  // struck through, and named in the WhatsApp message so the vendor honours it.
  prixBarre: integer("prix_barre"),
  badge: text("badge"),
  actif: boolean("actif").notNull().default(true),
  ordre: integer("ordre").notNull().default(0),
});

/* The flavours a pack is composed from. Out of stock hides nothing: the card
 * stays, greyed, so a student looking for it learns it is coming back. */
export const vendeurArticles = pgTable("vendeur_article", {
  id: serial("id").primaryKey(),
  vendeurId: integer("vendeur_id")
    .notNull()
    .references(() => vendeurs.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  enRupture: boolean("en_rupture").notNull().default(false),
  ordre: integer("ordre").notNull().default(0),
});

/*
 * The funnel, one row per event: a vendor page opened, a first pack put in
 * the basket, the WhatsApp button pressed. Keyed on the anonymous device
 * cookie like visits and polls; no name, no message text. A "commander" row
 * carries the reference printed in the message, so orders the vendor
 * actually received can be matched to Campusly afterwards.
 */
export const commandeEvenements = pgTable(
  "commande_evenement",
  {
    id: serial("id").primaryKey(),
    vendeurId: integer("vendeur_id")
      .notNull()
      .references(() => vendeurs.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["vue", "ajout", "commander"] }).notNull(),
    deviceId: text("device_id").notNull(),
    classeId: integer("classe_id").references(() => classes.id, { onDelete: "set null" }),
    reference: text("reference"),
    nbArticles: integer("nb_articles"),
    total: integer("total"),
    // For "commander": [{ formule, parfums: { nom: quantité } }]
    detail: jsonb("detail"),
    /*
     * The account, when the student was signed in. Only signed-in orders
     * count on the loyalty card, so the card follows the person across
     * phones; the name is never shown anywhere from here.
     */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    // Set by the vendor from their link: "livree" or "non_recue". Null = to do.
    statut: text("statut", { enum: ["livree", "non_recue"] }),
    statutLe: timestamp("statut_le", { mode: "date" }),
    // Which order this was on the card (1, 2, 3…) and the gift it carried.
    rang: integer("rang"),
    recompense: text("recompense"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("commande_evenement_vendeur").on(t.vendeurId, t.createdAt),
    index("commande_evenement_user").on(t.userId, t.vendeurId),
  ]
);

/*
 * An alert about past papers, held until a set time. Papers filed straight
 * into the database at night would otherwise be announced either at once,
 * waking a promo at 1am, or never. The morning cron sends what is due and
 * stamps it, so a retried run cannot announce the same papers twice.
 */
export const notificationsAnnales = pgTable("notification_annales", {
  id: serial("id").primaryKey(),
  filiere: text("filiere").notNull(),
  niveau: text("niveau").notNull(),
  // Papers of this promo filed from this moment on are the ones announced.
  depuis: timestamp("depuis", { mode: "date" }).notNull(),
  envoyerApres: timestamp("envoyer_apres", { mode: "date" }).notNull(),
  envoyeeLe: timestamp("envoyee_le", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
