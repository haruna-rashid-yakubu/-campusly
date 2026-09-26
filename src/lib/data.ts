import { and, asc, desc, eq, isNotNull, ne, notInArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  classes,
  cites,
  creneaux,
  programmePublications,
  roomTypes,
  subjectSubmissions,
  subjects,
  subjectTypeEnum,
} from "@/db/schema";
import { BANNER_COOKIE, CLASSE_COOKIE, DEFAULT_CLASSE } from "@/lib/constants";

export async function getPreferredClasse() {
  const store = await cookies();
  return store.get(CLASSE_COOKIE)?.value || DEFAULT_CLASSE;
}

export async function isBannerDismissed() {
  const store = await cookies();
  return store.get(BANNER_COOKIE)?.value === "1";
}

export type SubjectFilters = {
  q?: string;
  filiere?: string;
  niveau?: string;
  annee?: string;
  type?: string;
  enseignant?: string;
};

export async function getSubjects(filters: SubjectFilters = {}) {
  const conditions = [];
  // Students look for a course *or* a lecturer in the same box ("Noumo",
  // "macro"), so one query has to match both columns. Combined with the
  // enseignant facet below, this answers "what did Dr. X give in macro ?".
  if (filters.q) {
    const like = `%${filters.q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${subjects.matiere}) like ${like} or lower(coalesce(${subjects.enseignant}, '')) like ${like})`
    );
  }
  if (filters.enseignant) conditions.push(eq(subjects.enseignant, filters.enseignant));
  if (filters.filiere) conditions.push(eq(subjects.filiere, filters.filiere));
  if (filters.niveau) conditions.push(eq(subjects.niveau, filters.niveau));
  if (filters.annee) conditions.push(eq(subjects.annee, filters.annee));
  if (filters.type) conditions.push(eq(subjects.type, filters.type as (typeof subjects.type.enumValues)[number]));

  return db
    .select()
    .from(subjects)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(subjects.createdAt));
}

// Filter options are derived from what's actually in the table — a hardcoded
// list silently drifts out of sync every time a subject with a new filière or
// année is published, making those subjects unreachable from the filter bar.
export async function getSubjectFacets() {
  const rows = await db
    .select({
      filiere: subjects.filiere,
      niveau: subjects.niveau,
      annee: subjects.annee,
      type: subjects.type,
      enseignant: subjects.enseignant,
    })
    .from(subjects);

  const uniq = (values: string[]) => [...new Set(values)];

  return {
    filiere: uniq(rows.map((r) => r.filiere)).sort((a, b) => a.localeCompare(b, "fr")),
    niveau: uniq(rows.map((r) => r.niveau)).sort((a, b) => a.localeCompare(b, "fr")),
    // Years descending, with the papers whose year could not be read pushed
    // to the end rather than sorted in as if "Année inconnue" were a date.
    annee: uniq(rows.map((r) => r.annee)).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isNaN(na) !== Number.isNaN(nb)) return Number.isNaN(na) ? 1 : -1;
      return Number.isNaN(na) ? a.localeCompare(b, "fr") : nb - na;
    }),
    type: subjectTypeEnum.filter((t) => rows.some((r) => r.type === t)),
    // enseignant is nullable — most older papers have no name on them yet.
    enseignant: uniq(rows.map((r) => r.enseignant).filter((e): e is string => Boolean(e))).sort(
      (a, b) => a.localeCompare(b, "fr")
    ),
  };
}

// The proposer form offers what the bank already holds, plus escape hatches.
// A hardcoded list here drifted out of sync twice before: it still advertised
// Génie civil and Gestion long after those demo papers were the only ones.
export async function getProposerFacets() {
  const rows = await db
    .select({ filiere: subjects.filiere, niveau: subjects.niveau, matiere: subjects.matiere })
    .from(subjects);

  const uniq = (values: string[]) =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
  const thisYear = new Date().getFullYear();

  return {
    filiere: uniq(rows.map((r) => r.filiere)),
    niveau: uniq(rows.map((r) => r.niveau)),
    matiere: [...uniq(rows.map((r) => r.matiere)), "Autre matière"],
    // The escape hatch matters: an undated photocopy is still worth sending,
    // and a student forced to pick a year will pick a wrong one.
    annee: [...Array.from({ length: 6 }, (_, i) => String(thisYear - i)), "Année inconnue"],
    type: [...subjectTypeEnum],
  };
}

export async function getSubjectById(id: number) {
  const [row] = await db.select().from(subjects).where(eq(subjects.id, id));
  return row;
}

// Other papers of the same course (other years, and its TDs) are far more
// useful than anything else in the filière, so they're fetched separately
// and shown first.
export async function getRelatedSubjects(subjectId: number, matiere: string, filiere: string) {
  // Scoped to the filière as well as the matière: a course name can exist on
  // both sides of the campus, and suggesting the English paper to a LEG
  // student is exactly what the default filter upstream is there to prevent.
  const sameMatiere = await db
    .select()
    .from(subjects)
    .where(
      and(
        ne(subjects.id, subjectId),
        eq(subjects.matiere, matiere),
        eq(subjects.filiere, filiere)
      )
    )
    .orderBy(desc(subjects.annee))
    .limit(6);

  const excluded = [subjectId, ...sameMatiere.map((s) => s.id)];
  const sameFiliere = await db
    .select()
    .from(subjects)
    .where(and(notInArray(subjects.id, excluded), eq(subjects.filiere, filiere)))
    .orderBy(desc(subjects.createdAt))
    .limit(3);

  return { sameMatiere, sameFiliere };
}

export async function getUserSubmissions(userId: string) {
  return db
    .select()
    .from(subjectSubmissions)
    .where(eq(subjectSubmissions.userId, userId))
    .orderBy(desc(subjectSubmissions.createdAt));
}

export async function getSubmissionById(id: number) {
  return db.query.subjectSubmissions.findFirst({
    where: eq(subjectSubmissions.id, id),
    with: { user: true },
  });
}

export async function getModerationQueue() {
  return db.query.subjectSubmissions.findMany({
    where: eq(subjectSubmissions.status, "en_attente"),
    orderBy: (s, { asc }) => asc(s.createdAt),
    with: { user: true },
  });
}

export type CiteFilters = {
  maxDistanceM?: number;
  maxPrice?: number;
  quartier?: string;
  sort?: "distance" | "prix";
};

export async function getCitesWithAvailability(filters: CiteFilters = {}) {
  const rows = await db.query.cites.findMany({ with: { roomTypes: true } });

  const enriched = rows.map((c) => {
    const stock = c.roomTypes.reduce((a, r) => a + r.stock, 0);
    const minPrice = c.roomTypes.length ? Math.min(...c.roomTypes.map((r) => r.prixMensuel)) : 0;
    return { ...c, stock, minPrice };
  });

  const filtered = enriched.filter((c) => {
    if (filters.maxDistanceM != null && c.distanceM > filters.maxDistanceM) return false;
    if (filters.maxPrice != null && c.minPrice > filters.maxPrice) return false;
    if (filters.quartier && c.quartier !== filters.quartier) return false;
    return true;
  });

  if (filters.sort === "prix") {
    filtered.sort((a, b) => a.minPrice - b.minPrice);
  } else {
    filtered.sort((a, b) => a.distanceM - b.distanceM);
  }

  return filtered;
}

export async function getCiteById(id: number) {
  return db.query.cites.findFirst({
    where: eq(cites.id, id),
    with: { roomTypes: { orderBy: roomTypes.sortOrder } },
  });
}

export async function updateRoomStock(roomTypeId: number, delta: number) {
  const [row] = await db.select().from(roomTypes).where(eq(roomTypes.id, roomTypeId));
  if (!row) return;
  const next = Math.max(0, row.stock + delta);
  await db.update(roomTypes).set({ stock: next }).where(eq(roomTypes.id, roomTypeId));
}

export async function getPressings() {
  return db.query.pressings.findMany({
    with: { tarifs: { orderBy: (t, { asc }) => asc(t.sortOrder) } },
  });
}

// The three years of a licence. A niveau outside this list — "Terminale" on
// the Concours d'entrée papers — is not a promo: it has no weekly programme,
// so turning it into a classe would only add a row the Programme tab nags
// about forever.
const LICENCE_LEVELS = ["L1", "L2", "L3"] as const;

/*
 * A filière with no classe row is invisible: its students cannot pick their
 * promo, so they never reach their own papers or their programme. LEG sat in
 * exactly that state with 26 papers published and no way to select it.
 *
 * Publishing a paper is therefore what brings a promo into existence, and for
 * a licence all three years are created at once — an L3 student has to be
 * able to pick L3 before anyone has sent a single L3 paper.
 */
export async function ensureClassesForFiliere(filiere: string, niveau: string) {
  const name = filiere.trim();
  if (!name) return;
  if (!LICENCE_LEVELS.includes(niveau.trim() as (typeof LICENCE_LEVELS)[number])) return;

  await db
    .insert(classes)
    .values(LICENCE_LEVELS.map((level) => ({ label: `${name} · ${level}` })))
    .onConflictDoNothing();
}

export async function getClasses() {
  return db.select().from(classes).orderBy(classes.id);
}

export async function getClasseByLabel(label: string) {
  const [row] = await db.select().from(classes).where(eq(classes.label, label));
  return row;
}

// Ordered by the week itself, not by when it was published: a correction
// pushed on Wednesday for the current week must not make last week the
// "latest" one again.
export async function getLatestProgramme(classeId: number) {
  return db.query.programmePublications.findFirst({
    where: eq(programmePublications.classeId, classeId),
    orderBy: (p, { desc }) => desc(p.semaine),
    with: { creneaux: { orderBy: [asc(creneaux.jour), asc(creneaux.moment)] } },
  });
}

export async function getProgrammeForWeek(classeId: number, semaine: Date) {
  return db.query.programmePublications.findFirst({
    where: and(
      eq(programmePublications.classeId, classeId),
      eq(programmePublications.semaine, semaine)
    ),
    with: { creneaux: { orderBy: [asc(creneaux.jour), asc(creneaux.moment)] } },
  });
}

export type ProgrammeWithCreneaux = NonNullable<Awaited<ReturnType<typeof getLatestProgramme>>>;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getClassesWithoutRecentProgramme() {
  const all = await getClasses();
  const cutoff = new Date(Date.now() - WEEK_MS);
  const results = await Promise.all(
    all.map(async (c) => {
      const latest = await getLatestProgramme(c.id);
      const manquant = !latest || latest.publishedAt < cutoff;
      return { classe: c, manquant };
    })
  );
  return results;
}

export async function getRecentSubjects(limit = 1) {
  return db.select().from(subjects).orderBy(desc(subjects.createdAt)).limit(limit);
}

export type NotificationItem = {
  id: string;
  icon: "cal" | "doc" | "flag";
  title: string;
  subtitle: string;
  href: string;
  date: Date;
};

export async function getNotificationFeed(userId?: string, limit = 30): Promise<NotificationItem[]> {
  const [programmes, submissions] = await Promise.all([
    db.query.programmePublications.findMany({
      with: { classe: true },
      orderBy: (p, { desc }) => desc(p.publishedAt),
      limit,
    }),
    userId
      ? db
          .select()
          .from(subjectSubmissions)
          .where(and(eq(subjectSubmissions.userId, userId), isNotNull(subjectSubmissions.reviewedAt)))
          .orderBy(desc(subjectSubmissions.reviewedAt))
          .limit(limit)
      : Promise.resolve([]),
  ]);

  const items: NotificationItem[] = [
    ...programmes.map((p) => ({
      id: `programme-${p.id}`,
      icon: "cal" as const,
      title: "Nouveau programme publié",
      subtitle: `${p.classe.label} — ${p.weekLabel}`,
      href: "/programme",
      date: p.publishedAt,
    })),
    ...submissions.map((s) =>
      s.status === "publie"
        ? {
            id: `submission-${s.id}`,
            icon: "doc" as const,
            title: "Ton sujet a été publié !",
            subtitle: `${s.matiere} · ${s.annee}`,
            href: s.publishedSubjectId ? `/sujets/${s.publishedSubjectId}` : "/sujets/mes-envois",
            date: s.reviewedAt!,
          }
        : {
            id: `submission-${s.id}`,
            icon: "flag" as const,
            title: "Ton envoi a été refusé",
            subtitle: s.note ?? `${s.matiere} · ${s.annee}`,
            href: "/sujets/mes-envois",
            date: s.reviewedAt!,
          }
    ),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items.slice(0, limit);
}

export async function getRecentCite() {
  const [row] = await db.query.cites.findMany({
    with: { roomTypes: true },
    orderBy: [desc(cites.createdAt)],
    limit: 1,
  });
  if (!row) return null;
  const minPrice = row.roomTypes.length ? Math.min(...row.roomTypes.map((r) => r.prixMensuel)) : 0;
  return { ...row, minPrice };
}
