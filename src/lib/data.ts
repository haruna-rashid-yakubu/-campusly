import { and, asc, desc, eq, inArray, isNotNull, ne, notInArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  classes,
  cites,
  creneaux,
  delegations,
  evenements,
  notificationEnvois,
  programmePropositions,
  programmePublications,
  roomTypes,
  subjectSubmissions,
  subjects,
  partagesEpreuve,
  subjectTypeEnum,
  users,
} from "@/db/schema";
import { BANNER_COOKIE, CLASSE_COOKIE, DEFAULT_CLASSE } from "@/lib/constants";
import { toISODate } from "@/lib/semaine";

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


/*
 * The papers a student of `filiere` is entitled to see.
 *
 * Their own filière always, plus the levels where the faculty sets one paper
 * for several promos. The sharing is read here rather than written into the
 * rows, so a paper sent once for LEG L1 reaches GRH L1 without being stored
 * twice — and the day a tronc commun ends, nothing has to be unpicked.
 *
 * `reserveFiliere` wins over the sharing: it is how the L1 maths paper, which
 * differs per filière inside an otherwise common year, stays home.
 */
async function conditionFiliere(filiere: string) {
  const miennes = await db
    .select({ niveau: partagesEpreuve.niveau, groupe: partagesEpreuve.groupe })
    .from(partagesEpreuve)
    .where(eq(partagesEpreuve.filiere, filiere));

  if (miennes.length === 0) return eq(subjects.filiere, filiere);

  const partenaires = await db
    .select({ filiere: partagesEpreuve.filiere, niveau: partagesEpreuve.niveau })
    .from(partagesEpreuve)
    .where(
      or(
        ...miennes.map((m) =>
          and(eq(partagesEpreuve.groupe, m.groupe), eq(partagesEpreuve.niveau, m.niveau))
        )
      )
    );

  const empruntees = partenaires
    .filter((p) => p.filiere !== filiere)
    .map((p) =>
      and(
        eq(subjects.filiere, p.filiere),
        eq(subjects.niveau, p.niveau),
        eq(subjects.reserveFiliere, false)
      )
    );

  return or(eq(subjects.filiere, filiere), ...empruntees)!;
}

/** The sharing as it stands, for the admin screen that has to show it. */
export async function getPartagesEpreuve() {
  return db
    .select()
    .from(partagesEpreuve)
    .orderBy(partagesEpreuve.niveau, partagesEpreuve.groupe, partagesEpreuve.filiere);
}

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
  if (filters.filiere) conditions.push(await conditionFiliere(filters.filiere));
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

/*
 * The waiting papers. `promos` narrows the queue to a délégué's own promos —
 * an empty screen is the honest answer when nobody in their year has sent
 * anything, and far better than showing them work they cannot act on.
 */
export async function getModerationQueue(promos?: string[]) {
  const rows = await db.query.subjectSubmissions.findMany({
    where: eq(subjectSubmissions.status, "en_attente"),
    orderBy: (s, { asc }) => asc(s.createdAt),
    with: { user: true },
  });
  if (!promos) return rows;
  return rows.filter((r) => promos.includes(`${r.filiere} · ${r.niveau}`));
}

/** Every délégué named, newest first, with the promo each one covers. */
export async function getDelegations() {
  return db
    .select({
      id: delegations.id,
      email: delegations.email,
      classeId: delegations.classeId,
      classeLabel: classes.label,
      nommePar: delegations.nommePar,
      createdAt: delegations.createdAt,
    })
    .from(delegations)
    .innerJoin(classes, eq(classes.id, delegations.classeId))
    .orderBy(desc(delegations.createdAt));
}

/** The labels behind a set of promo ids, in the order the database returns. */
export async function getClasseLabels(ids: number[]) {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: classes.id, label: classes.label })
    .from(classes)
    .where(inArray(classes.id, ids));
  return rows;
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

/*
 * Where a promo's week actually comes from.
 *
 * Reading follows the tronc commun by default, because every screen that
 * shows a timetable should show the one the student will sit in. Writing
 * never does: `brut` is how the admin grid, the publish action and the photo
 * route stay pointed at the promo named on screen, instead of silently
 * rewriting the promo it follows.
 */
type LectureProgramme = { brut?: boolean };

export async function classeSourceDuProgramme(classeId: number) {
  const [row] = await db
    .select({ programmeDe: classes.programmeDe })
    .from(classes)
    .where(eq(classes.id, classeId));
  // One hop only, and never onto itself: a chain or a loop here would be a
  // page that hangs rather than a timetable that is merely wrong.
  const source = row?.programmeDe;
  return source && source !== classeId ? source : classeId;
}

/** The promo a follower borrows from, or null when it publishes its own. */
export async function getTroncCommun(classeId: number) {
  const source = await classeSourceDuProgramme(classeId);
  if (source === classeId) return null;
  const [row] = await db
    .select({ id: classes.id, label: classes.label })
    .from(classes)
    .where(eq(classes.id, source));
  return row ?? null;
}

// Ordered by the week itself, not by when it was published: a correction
// pushed on Wednesday for the current week must not make last week the
// "latest" one again.
export async function getLatestProgramme(classeId: number, options: LectureProgramme = {}) {
  const cible = options.brut ? classeId : await classeSourceDuProgramme(classeId);
  return db.query.programmePublications.findFirst({
    where: eq(programmePublications.classeId, cible),
    orderBy: (p, { desc }) => desc(p.semaine),
    with: { creneaux: { orderBy: [asc(creneaux.jour), asc(creneaux.moment)] } },
  });
}

export async function getProgrammeForWeek(
  classeId: number,
  semaine: Date,
  options: LectureProgramme = {}
) {
  const cible = options.brut ? classeId : await classeSourceDuProgramme(classeId);
  return db.query.programmePublications.findFirst({
    where: and(
      eq(programmePublications.classeId, cible),
      eq(programmePublications.semaine, semaine)
    ),
    with: { creneaux: { orderBy: [asc(creneaux.jour), asc(creneaux.moment)] } },
  });
}

/*
 * Points a promo at the one it shares its week with, or cuts the link when
 * `sourceId` is null.
 *
 * Refuses to make a follower of a promo that is itself followed, and refuses
 * to point a promo at itself. Both would produce a timetable nobody can
 * reach, and the second would be a loop.
 */
export async function definirProgrammeDe(classeId: number, sourceId: number | null) {
  if (sourceId === classeId) return { ok: false as const, message: "Une promo ne peut pas suivre son propre programme." };

  if (sourceId !== null) {
    const [source] = await db
      .select({ programmeDe: classes.programmeDe, label: classes.label })
      .from(classes)
      .where(eq(classes.id, sourceId));
    if (!source) return { ok: false as const, message: "Promo source introuvable." };
    if (source.programmeDe !== null) {
      return {
        ok: false as const,
        message: `${source.label} suit déjà une autre promo. Choisis celle qui publie vraiment.`,
      };
    }
    const suiveurs = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.programmeDe, classeId));
    if (suiveurs.length > 0) {
      return {
        ok: false as const,
        message: "D'autres promos suivent déjà celle-ci : elle doit publier son propre programme.",
      };
    }
  }

  await db.update(classes).set({ programmeDe: sourceId }).where(eq(classes.id, classeId));
  return { ok: true as const };
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


/*
 * The audience, counted in devices. The same student on a phone and a laptop
 * is two, and clearing site data makes a third — there is no honest way
 * around that short of making everyone sign in, which would cost far more
 * readers than the precision is worth. Read these as an order of magnitude
 * and a direction, not as a headcount.
 */
export async function getAudience() {
  const totauxResult = await db.execute<{
    total: number;
    aujourdhui: number;
    sept_jours: number;
    nouveaux_sept_jours: number;
    installes_sept_jours: number;
    fideles: number;
    ouvertures_sept_jours: number;
  }>(sql`
    select
      count(distinct device_id)::int as total,
      count(distinct device_id) filter (where jour = current_date)::int as aujourdhui,
      count(distinct device_id) filter (where jour > current_date - 7)::int as sept_jours,
      count(distinct device_id) filter (where premiere_visite and jour > current_date - 7)::int as nouveaux_sept_jours,
      -- Opened from the home screen at least once this week: the only read
      -- we get on installation, since nothing reports the install itself.
      count(distinct device_id) filter (where standalone and jour > current_date - 7)::int as installes_sept_jours,
      coalesce(sum(ouvertures) filter (where jour > current_date - 7), 0)::int as ouvertures_sept_jours,
      -- Someone who came back on a different day. The only number that says
      -- whether the app stuck, as opposed to whether a link got clicked.
      (select count(*)::int from (
         select device_id from visite group by device_id having count(distinct jour) > 1
       ) as revenus)::int as fideles
    from visite
  `);

  const parJourResult = await db.execute<{ jour: string; appareils: number }>(sql`
    select to_char(jour, 'YYYY-MM-DD') as jour, count(distinct device_id)::int as appareils
    from visite where jour > current_date - 14
    group by jour order by jour
  `);

  const parClasseResult = await db.execute<{ classe: string; appareils: number }>(sql`
    select coalesce(c.label, 'Promo non choisie') as classe,
           count(distinct v.device_id)::int as appareils
    from visite v left join classe c on c.id = v.classe_id
    where v.jour > current_date - 7
    group by c.label order by appareils desc
  `);

  // The neon-http driver hands back { rows }, not an array.
  const [totaux] = totauxResult.rows;

  return {
    ...(totaux ?? {
      total: 0,
      aujourdhui: 0,
      sept_jours: 0,
      nouveaux_sept_jours: 0,
      installes_sept_jours: 0,
      fideles: 0,
      ouvertures_sept_jours: 0,
    }),
    parJour: parJourResult.rows,
    parClasse: parClasseResult.rows,
  };
}

/*
 * What a student actually finds once they have named their promo.
 *
 * The question the audience numbers cannot answer: a promo can have readers,
 * subscribers and still be an empty app — no timetable for the week, no past
 * papers. That gap used to be invisible, because everyone who had not chosen
 * was shown the default promo's week and so nobody landed on nothing. Now
 * that the promo is asked for up front, an empty one is the first thing its
 * students see, which makes this the table to read before a launch.
 */
export async function getCouverture(semaine: Date) {
  const lignes = await db.execute<{
    classe: string;
    appareils: number;
    abonnes: number;
    programme: boolean;
    annales: number;
  }>(sql`
    select c.label as classe,
           (select count(distinct v.device_id)::int from visite v
             where v.classe_id = c.id and v.jour > current_date - 7) as appareils,
           (select count(*)::int from push_subscription ps
              left join "user" u on u.id = ps.user_id
             where coalesce(u.classe_id, ps.classe_id) = c.id) as abonnes,
           exists(select 1 from programme_publication p
                   where p.classe_id = c.id and p.semaine = ${toISODate(semaine)}) as programme,
           (select count(*)::int from subject s
             where s.filiere = split_part(c.label, ' · ', 1)
               and s.niveau = split_part(c.label, ' · ', 2)) as annales
    from classe c
    order by c.label
  `);

  const notifsResult = await db.execute<{ total: number; joignables: number }>(sql`
    select count(*)::int as total,
           count(*) filter (
             where coalesce(u.classe_id, ps.classe_id) is not null
           )::int as joignables
    from push_subscription ps
    left join "user" u on u.id = ps.user_id
  `);

  const [notifs] = notifsResult.rows;
  return {
    classes: lignes.rows,
    notifs: notifs ?? { total: 0, joignables: 0 },
  };
}

/*
 * Timetable photos waiting for an answer. `promos` narrows the queue to a
 * délégué's own promos; an admin passes nothing and sees every one.
 */
export async function getPropositionsProgramme(promos?: string[]) {
  const rows = await db
    .select({
      id: programmePropositions.id,
      classeLabel: classes.label,
      semaine: programmePropositions.semaine,
      photoUrl: programmePropositions.photoUrl,
      note: programmePropositions.note,
      createdAt: programmePropositions.createdAt,
      auteur: users.name,
    })
    .from(programmePropositions)
    .innerJoin(classes, eq(classes.id, programmePropositions.classeId))
    .innerJoin(users, eq(users.id, programmePropositions.userId))
    .where(eq(programmePropositions.status, "en_attente"))
    .orderBy(asc(programmePropositions.createdAt));
  if (!promos) return rows;
  return rows.filter((r) => promos.includes(r.classeLabel));
}

/*
 * The last notifications sent, newest first. `atteints` is the number of
 * devices the push service took the message for — zero means it rang nowhere,
 * which is the one thing worth seeing at a glance.
 */
export async function getJournalNotifications(limite = 40) {
  return db
    .select({
      id: notificationEnvois.id,
      type: notificationEnvois.type,
      classeLabel: classes.label,
      titre: notificationEnvois.titre,
      corps: notificationEnvois.corps,
      atteints: notificationEnvois.atteints,
      vises: notificationEnvois.vises,
      createdAt: notificationEnvois.createdAt,
    })
    .from(notificationEnvois)
    .leftJoin(classes, eq(classes.id, notificationEnvois.classeId))
    .orderBy(desc(notificationEnvois.createdAt))
    .limit(limite);
}

/*
 * Every promo that borrows its week, with the one it borrows from — the list
 * the admin screen shows so a tronc commun can be seen and cut, rather than
 * being a fact buried in a column nobody looks at.
 */
export async function getLiensTroncCommun() {
  const source = alias(classes, "source");
  return db
    .select({ classe: classes.label, suit: source.label })
    .from(classes)
    .innerJoin(source, eq(source.id, classes.programmeDe))
    .orderBy(classes.label);
}

/*
 * Every promo that will see a paper filed under this (filière, niveau) — the
 * one it was published for, plus the ones sharing its tronc commun at that
 * level.
 *
 * Used to decide who gets told. Telling only the promo it was filed under
 * would leave LQSSE and LSSD to discover GRH's new papers by chance, which is
 * the whole point of sharing them.
 */
export async function getClassesQuiVoient(filiere: string, niveau: string) {
  const [mien] = await db
    .select({ groupe: partagesEpreuve.groupe })
    .from(partagesEpreuve)
    .where(and(eq(partagesEpreuve.filiere, filiere), eq(partagesEpreuve.niveau, niveau)));

  const filieres = new Set([filiere]);
  if (mien) {
    const partenaires = await db
      .select({ filiere: partagesEpreuve.filiere })
      .from(partagesEpreuve)
      .where(and(eq(partagesEpreuve.groupe, mien.groupe), eq(partagesEpreuve.niveau, niveau)));
    for (const p of partenaires) filieres.add(p.filiere);
  }

  const labels = [...filieres].map((f) => `${f} · ${niveau}`);
  return db.select({ id: classes.id, label: classes.label }).from(classes).where(inArray(classes.label, labels));
}

/*
 * What each cité got out of being on Campusly.
 *
 * Two numbers, not one, because they answer different questions and only one
 * of them is the one a landlord cares about. `personnes` counts distinct
 * students; `contacts` counts taps. A student who opens the number three times
 * over a week while deciding is one person and three contacts, and quoting the
 * second figure as though it were the first is how Campusly would come to be
 * distrusted by the very people it needs.
 *
 * Note what this cannot know: whether anyone actually wrote, visited, or
 * rented. The tap is where our sight ends. The admin screen says as much.
 */
export async function getStatsCites() {
  const rows = await db
    .select({
      citeId: evenements.cibleId,
      type: evenements.type,
      personnes: sql<number>`count(distinct coalesce(${evenements.userId}, ${evenements.id}::text))`,
      total: sql<number>`count(*)`,
      dernier: sql<Date | null>`max(${evenements.createdAt})`,
    })
    .from(evenements)
    .where(eq(evenements.cible, "cite"))
    .groupBy(evenements.cibleId, evenements.type);

  const par = new Map<
    number,
    { personnes: number; contacts: number; partages: number; dernier: Date | null }
  >();

  for (const r of rows) {
    if (r.citeId == null) continue;
    const e =
      par.get(r.citeId) ?? { personnes: 0, contacts: 0, partages: 0, dernier: null };
    if (r.type === "contact_bailleur") {
      e.personnes = Number(r.personnes);
      e.contacts = Number(r.total);
      e.dernier = r.dernier ? new Date(r.dernier) : null;
    } else {
      e.partages = Number(r.total);
    }
    par.set(r.citeId, e);
  }

  return par;
}

/*
 * Shares, broken down by the route that was used.
 *
 * Taps only, with no count of distinct people: sharing is not behind the
 * sign-in gate, so most rows have no account on them, and any "people" figure
 * here would be a guess dressed as a measurement. Which route gets used is
 * the useful part anyway — it says whether the Statut poster was worth
 * building.
 */
export async function getStatsPartages() {
  const rows = await db
    .select({
      canal: evenements.canal,
      total: sql<number>`count(*)`,
    })
    .from(evenements)
    .where(eq(evenements.type, "partage"))
    .groupBy(evenements.canal)
    .orderBy(desc(sql`count(*)`));

  return rows.map((r) => ({ canal: r.canal ?? "autre", total: Number(r.total) }));
}
