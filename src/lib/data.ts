import { and, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  classes,
  cites,
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
};

export async function getSubjects(filters: SubjectFilters = {}) {
  const conditions = [];
  if (filters.q) conditions.push(sql`lower(${subjects.matiere}) like ${"%" + filters.q.toLowerCase() + "%"}`);
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
    })
    .from(subjects);

  const uniq = (values: string[]) => [...new Set(values)];

  return {
    filiere: uniq(rows.map((r) => r.filiere)).sort((a, b) => a.localeCompare(b, "fr")),
    niveau: uniq(rows.map((r) => r.niveau)).sort((a, b) => a.localeCompare(b, "fr")),
    annee: uniq(rows.map((r) => r.annee)).sort((a, b) => b.localeCompare(a)),
    type: subjectTypeEnum.filter((t) => rows.some((r) => r.type === t)),
  };
}

export async function getSubjectById(id: number) {
  const [row] = await db.select().from(subjects).where(eq(subjects.id, id));
  return row;
}

export async function getSimilarSubjects(subjectId: number, filiere: string) {
  return db
    .select()
    .from(subjects)
    .where(and(ne(subjects.id, subjectId), eq(subjects.filiere, filiere)))
    .limit(2);
}

export async function getUserSubmissions(userId: string) {
  return db
    .select()
    .from(subjectSubmissions)
    .where(eq(subjectSubmissions.userId, userId))
    .orderBy(desc(subjectSubmissions.createdAt));
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

export async function getClasses() {
  return db.select().from(classes).orderBy(classes.id);
}

export async function getClasseByLabel(label: string) {
  const [row] = await db.select().from(classes).where(eq(classes.label, label));
  return row;
}

export async function getLatestProgramme(classeId: number) {
  const [row] = await db
    .select()
    .from(programmePublications)
    .where(eq(programmePublications.classeId, classeId))
    .orderBy(desc(programmePublications.publishedAt))
    .limit(1);
  return row;
}

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
