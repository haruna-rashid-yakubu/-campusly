"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import {
  creneaux,
  roomTypes,
  subjectSubmissions,
  subjects,
  programmePublications,
  pushSubscriptions,
  subjectTypeEnum,
  momentEnum,
  users,
} from "@/db/schema";
import { deleteFile, uploadFile } from "@/lib/blob";
import { ensureClassesForFiliere, getClasseByLabel, getProgrammeForWeek } from "@/lib/data";
import { fromISODate, mondayOf, weekRangeLabel } from "@/lib/semaine";
import { BANNER_COOKIE, CLASSE_COOKIE } from "@/lib/constants";
import { sendPushToAdmins, sendPushToClasse, sendPushToUser } from "@/lib/push";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Connecte-toi pour continuer.");
  return session.user;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Réservé à l'équipe Campusly.");
  }
  return session.user;
}

export async function googleSignIn() {
  await signIn("google");
}

export async function appSignOut() {
  await signOut();
}

export async function setClasse(label: string) {
  const store = await cookies();
  store.set(CLASSE_COOKIE, label, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  // The cookie alone is unreadable from a cron job, so the choice is mirrored
  // onto the account. Signed-out visitors keep only the cookie until they
  // sign in, at which point their next pick fills this in.
  const session = await auth();
  if (session?.user?.id) {
    const classe = await getClasseByLabel(label);
    if (classe) {
      await db.update(users).set({ classeId: classe.id }).where(eq(users.id, session.user.id));
      // Their devices carry a stamp from whenever they enabled notifications;
      // left behind, it would still describe the promo they just left.
      await db
        .update(pushSubscriptions)
        .set({ classeId: classe.id })
        .where(eq(pushSubscriptions.userId, session.user.id));
    }
  }

  revalidatePath("/");
  revalidatePath("/programme");
  revalidatePath("/admin");
}

export async function dismissInstallBanner() {
  const store = await cookies();
  store.set(BANNER_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
}

// Taken from the schema rather than retyped: this list had drifted and was
// missing "TD", so an admin could neither publish nor edit a TD even though
// TDs are in the bank and the picker offered the type.
const SUBJECT_TYPES = subjectTypeEnum;

export async function proposeSubject(formData: FormData) {
  const user = await requireUser();

  const filiere = String(formData.get("filiere") ?? "");
  const niveau = String(formData.get("niveau") ?? "");
  const matiere = String(formData.get("matiere") ?? "");
  const annee = String(formData.get("annee") ?? "");
  const type = String(formData.get("type") ?? "");
  const file = formData.get("file") as File | null;

  if (!filiere || !niveau || !matiere || !annee || !type) {
    throw new Error("Remplis tous les champs avant d'envoyer.");
  }
  if (!SUBJECT_TYPES.includes(type as (typeof SUBJECT_TYPES)[number])) {
    throw new Error("Type d'épreuve invalide.");
  }

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  if (file && file.size > 0) {
    const uploaded = await uploadFile(file, "submissions");
    fileUrl = uploaded.url;
    fileName = uploaded.name;
  }

  const [submission] = await db
    .insert(subjectSubmissions)
    .values({
      userId: user.id,
      filiere,
      niveau,
      matiere,
      annee,
      type: type as (typeof SUBJECT_TYPES)[number],
      fileUrl,
      fileName,
    })
    .returning();

  // Deep-link straight to the review screen: an admin tapping the notification
  // lands on the document itself, not on a queue they then have to search.
  await sendPushToAdmins({
    title: "Nouveau sujet proposé",
    body: `${matiere} · ${niveau} · ${annee} — par ${user.name ?? "un étudiant"}`,
    url: `/admin/envois/${submission.id}`,
  });

  revalidatePath("/sujets/mes-envois");
  revalidatePath("/admin");
  revalidatePath("/");
}

export type SubjectEdits = {
  matiere: string;
  filiere: string;
  niveau: string;
  annee: string;
  type: string;
  enseignant: string;
  corrige: boolean;
};

// `edits` carries what the admin corrected on the review screen. Students
// mistype the matière or guess the année, so the row that gets published is
// the reviewed version, not the raw submission.
export async function moderateSubject(
  submissionId: number,
  decision: "publie" | "refuse",
  note?: string,
  edits?: SubjectEdits
) {
  await requireAdmin();

  const [submission] = await db
    .select()
    .from(subjectSubmissions)
    .where(eq(subjectSubmissions.id, submissionId));
  if (!submission) return;

  if (decision === "publie") {
    const type = edits?.type ?? submission.type;
    if (!SUBJECT_TYPES.includes(type as (typeof SUBJECT_TYPES)[number])) {
      throw new Error("Type d'épreuve invalide.");
    }
    const enseignant = edits?.enseignant?.trim();

    const [published] = await db
      .insert(subjects)
      .values({
        matiere: edits?.matiere?.trim() || submission.matiere,
        filiere: edits?.filiere?.trim() || submission.filiere,
        niveau: edits?.niveau?.trim() || submission.niveau,
        annee: edits?.annee?.trim() || submission.annee,
        type: type as (typeof SUBJECT_TYPES)[number],
        corrige: edits?.corrige ?? false,
        enseignant: enseignant ? enseignant : null,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
      })
      .returning();

    // Publishing into a filière nobody has published into yet also opens that
    // promo, otherwise its students have no classe to select and never see
    // the paper that was just put online for them.
    await ensureClassesForFiliere(published.filiere, published.niveau);

    await db
      .update(subjectSubmissions)
      .set({ status: "publie", reviewedAt: new Date(), publishedSubjectId: published.id })
      .where(eq(subjectSubmissions.id, submissionId));

    await sendPushToUser(submission.userId, {
      title: "Ton sujet a été publié !",
      body: `${submission.matiere} · ${submission.annee} est maintenant en ligne sur Campusly.`,
      url: `/sujets/${published.id}`,
    });
  } else {
    await db
      .update(subjectSubmissions)
      .set({
        status: "refuse",
        reviewedAt: new Date(),
        note: note ?? "Photo illisible — renvoie-la mieux cadrée.",
      })
      .where(eq(subjectSubmissions.id, submissionId));

    await sendPushToUser(submission.userId, {
      title: "Ton envoi a été refusé",
      body: note ?? "Photo illisible — renvoie-la mieux cadrée.",
      url: "/sujets/mes-envois",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/sujets");
  revalidatePath("/sujets/mes-envois");
}

export async function updateSubject(subjectId: number, edits: SubjectEdits) {
  await requireAdmin();

  if (!SUBJECT_TYPES.includes(edits.type as (typeof SUBJECT_TYPES)[number])) {
    throw new Error("Type d'épreuve invalide.");
  }
  const matiere = edits.matiere.trim();
  const filiere = edits.filiere.trim();
  const niveau = edits.niveau.trim();
  const annee = edits.annee.trim();
  if (!matiere || !filiere || !niveau || !annee) {
    throw new Error("Matière, filière, niveau et année sont obligatoires.");
  }
  const enseignant = edits.enseignant.trim();

  await db
    .update(subjects)
    .set({
      matiere,
      filiere,
      niveau,
      annee,
      type: edits.type as (typeof SUBJECT_TYPES)[number],
      corrige: edits.corrige,
      enseignant: enseignant ? enseignant : null,
    })
    .where(eq(subjects.id, subjectId));

  // Retyping the filière on an existing paper is the other way a new one
  // appears, so the promo has to be opened here too.
  await ensureClassesForFiliere(filiere, niveau);

  revalidatePath("/admin");
  revalidatePath("/sujets");
  revalidatePath(`/sujets/${subjectId}`);
}

export async function deleteSubject(subjectId: number) {
  await requireAdmin();

  const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
  if (!subject) return;

  // A published submission points back at this row with no ON DELETE rule, so
  // the delete would fail on the foreign key. Detaching first keeps the
  // student's "Ton sujet a été publié" history instead of cascading it away.
  await db
    .update(subjectSubmissions)
    .set({ publishedSubjectId: null })
    .where(eq(subjectSubmissions.publishedSubjectId, subjectId));

  await db.delete(subjects).where(eq(subjects.id, subjectId));

  // Best effort: an orphaned blob costs storage but a failure here must not
  // leave the row deleted-but-reported-failed.
  if (subject.fileUrl) await deleteFile(subject.fileUrl);
  if (subject.correctionUrl) await deleteFile(subject.correctionUrl);

  revalidatePath("/admin");
  revalidatePath("/sujets");
}

export async function incrementSubjectDownload(subjectId: number) {
  await db
    .update(subjects)
    .set({ downloads: sql`${subjects.downloads} + 1` })
    .where(eq(subjects.id, subjectId));
  revalidatePath(`/sujets/${subjectId}`);
}

export async function adjustRoomStock(roomTypeId: number, delta: number) {
  await requireAdmin();

  const [row] = await db.select().from(roomTypes).where(eq(roomTypes.id, roomTypeId));
  if (!row) return;
  const next = Math.max(0, row.stock + delta);
  await db.update(roomTypes).set({ stock: next }).where(eq(roomTypes.id, roomTypeId));

  revalidatePath("/admin");
  revalidatePath("/logements");
  revalidatePath(`/logements/${row.citeId}`);
}

export type CreneauInput = {
  jour: number;
  moment: (typeof momentEnum)[number];
  matiere: string;
  enseignant?: string;
  salle?: string;
  seance?: number | null;
  seances?: number | null;
  cc?: boolean;
};

/*
 * One week of one promo, saved in one go: the photo of the noticeboard and
 * the grid that drives the reminders. Both are optional on their own — a week
 * can go up as a photo while the grid is still being typed, and a grid is
 * worth having even when nobody photographed the sheet.
 *
 * Keyed on (classe, Monday), so saving again corrects the week in place
 * rather than stacking a second version students would have to tell apart.
 */
export async function saveProgramme(formData: FormData) {
  await requireAdmin();

  const classeLabel = String(formData.get("classeLabel") ?? "");
  const classe = await getClasseByLabel(classeLabel);
  if (!classe) throw new Error("Classe inconnue.");

  const semaine = mondayOf(fromISODate(String(formData.get("semaine") ?? "")));
  if (Number.isNaN(semaine.getTime())) throw new Error("Semaine invalide.");

  const weekLabel = String(formData.get("weekLabel") ?? "").trim() || `Semaine ${weekRangeLabel(semaine)}`;
  const salleDefaut = String(formData.get("salleDefaut") ?? "").trim() || null;

  let grid: CreneauInput[] = [];
  try {
    grid = JSON.parse(String(formData.get("creneaux") ?? "[]")) as CreneauInput[];
  } catch {
    throw new Error("Grille illisible.");
  }

  const file = formData.get("file") as File | null;
  const existing = await getProgrammeForWeek(classe.id, semaine);
  const uploaded = file && file.size > 0 ? await uploadFile(file, "programme") : null;
  if (!uploaded && !existing && grid.length === 0) {
    throw new Error("Ajoute une photo ou remplis au moins une case.");
  }

  const [row] = await db
    .insert(programmePublications)
    .values({
      classeId: classe.id,
      semaine,
      weekLabel,
      salleDefaut,
      photoUrl: uploaded?.url ?? null,
    })
    .onConflictDoUpdate({
      target: [programmePublications.classeId, programmePublications.semaine],
      set: {
        weekLabel,
        salleDefaut,
        // A save without a new photo keeps the one already there.
        ...(uploaded ? { photoUrl: uploaded.url } : {}),
        publishedAt: new Date(),
      },
    })
    .returning();

  // The grid is replaced wholesale rather than diffed: a cell that was emptied
  // has no row to update, and "no row" is exactly how the app reads "no class".
  await db.delete(creneaux).where(eq(creneaux.programmeId, row.id));
  const cells = grid
    .filter((c) => c.matiere?.trim())
    .map((c) => ({
      programmeId: row.id,
      jour: c.jour,
      moment: c.moment,
      matiere: c.matiere.trim(),
      enseignant: c.enseignant?.trim() || null,
      salle: c.salle?.trim() || null,
      seance: c.seance ?? null,
      seances: c.seances ?? null,
      cc: c.cc ?? false,
    }));
  if (cells.length) await db.insert(creneaux).values(cells);

  revalidatePath("/admin");
  revalidatePath("/programme");

  // Only the promo concerned. Sent to everyone, this was four notifications a
  // week about other people's timetables — the fastest way to get the app's
  // notifications switched off altogether. Silent on a correction, so fixing a
  // room at 21h does not buzz a hundred phones a second time.
  if (!existing) {
    await sendPushToClasse(classe.id, {
      title: `Programme de la semaine — ${classeLabel}`,
      body: weekLabel,
      url: "/programme",
    });
  }
}

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();

  // Stamped with the promo showing on this device at the moment notifications
  // were turned on. Without it, a subscription with no account behind it is
  // unreachable by anything promo-specific.
  const store = await cookies();
  const label = store.get(CLASSE_COOKIE)?.value;
  const classe = label ? await getClasseByLabel(label) : undefined;
  const classeId = classe?.id ?? null;

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session?.user?.id ?? null,
      classeId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: session?.user?.id ?? null,
        classeId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
}

export async function unsubscribePush(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
