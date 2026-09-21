"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import {
  roomTypes,
  subjectSubmissions,
  subjects,
  programmePublications,
  pushSubscriptions,
} from "@/db/schema";
import { deleteFile, uploadFile } from "@/lib/blob";
import { getClasseByLabel } from "@/lib/data";
import { BANNER_COOKIE, CLASSE_COOKIE } from "@/lib/constants";
import { sendPushToAdmins, sendPushToAll, sendPushToUser } from "@/lib/push";

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
  revalidatePath("/");
  revalidatePath("/programme");
  revalidatePath("/admin");
}

export async function dismissInstallBanner() {
  const store = await cookies();
  store.set(BANNER_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
}

const SUBJECT_TYPES = ["Partiel", "Examen", "Rattrapage"] as const;

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

export async function publishProgramme(classeLabel: string, weekLabel: string, formData: FormData) {
  await requireAdmin();

  const classe = await getClasseByLabel(classeLabel);
  if (!classe) throw new Error("Classe inconnue.");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Ajoute une photo du programme.");

  const uploaded = await uploadFile(file, "programme");

  await db.insert(programmePublications).values({
    classeId: classe.id,
    photoUrl: uploaded.url,
    weekLabel,
  });

  revalidatePath("/admin");
  revalidatePath("/programme");

  await sendPushToAll({
    title: "Nouveau programme publié",
    body: `${classeLabel} — ${weekLabel}`,
    url: "/programme",
  });
}

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session?.user?.id ?? null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: session?.user?.id ?? null,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
}

export async function unsubscribePush(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
