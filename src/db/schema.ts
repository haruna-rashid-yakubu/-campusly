import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  serial,
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
  label: text("label").notNull().unique(), // e.g. "Génie informatique · L2"
});

export const subjectTypeEnum = ["Partiel", "Examen", "Rattrapage"] as const;

export const subjects = pgTable("subject", {
  id: serial("id").primaryKey(),
  matiere: text("matiere").notNull(),
  filiere: text("filiere").notNull(),
  niveau: text("niveau").notNull(),
  annee: text("annee").notNull(),
  type: text("type", { enum: subjectTypeEnum }).notNull(),
  corrige: boolean("corrige").notNull().default(false),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
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

export const programmePublications = pgTable("programme_publication", {
  id: serial("id").primaryKey(),
  classeId: integer("classe_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  weekLabel: text("week_label").notNull(), // "Semaine du 21 au 26 sept."
  publishedAt: timestamp("published_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

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

export const programmePublicationsRelations = relations(programmePublications, ({ one }) => ({
  classe: one(classes, { fields: [programmePublications.classeId], references: [classes.id] }),
}));
