"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import {
  cites,
  classes,
  creneaux,
  delegations,
  programmePropositions,
  roomTypes,
  subjectSubmissions,
  subjects,
  programmePublications,
  pushSubscriptions,
  subjectTypeEnum,
  users,
  visites,
} from "@/db/schema";
import { deleteFile, uploadFile } from "@/lib/blob";
import {
  ensureClassesForFiliere,
  getClasseByLabel,
  getPreferredClasse,
  getProgrammeForWeek,
  definirProgrammeDe,
  getTroncCommun,
  getClassesQuiVoient,
} from "@/lib/data";
import { fromISODate, mondayOf, nowInWAT, startOfDay, weekRangeLabel } from "@/lib/semaine";
import { BANNER_COOKIE, CLASSE_COOKIE, DEVICE_COOKIE, momentDuSlot } from "@/lib/constants";
import {
  sendPushToAdmins,
  sendPushToClasse,
  sendPushToDelegues,
  sendPushToEmail,
  sendPushToUser,
} from "@/lib/push";

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

/*
 * The délégué check. An admin passes everywhere; a délégué passes only on the
 * promos they were named for, which is the whole point of the role: the power
 * is not "fewer buttons", it is "this promo and no other". Everything a
 * délégué can do goes through here, so there is one place to read to know
 * exactly how far the right reaches.
 */
async function requireDroitSurClasse(classeId: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Connecte-toi pour continuer.");
  if (session.user.role === "admin") return session.user;
  if (session.user.delegations?.includes(classeId)) return session.user;
  throw new Error("Tu n'es pas délégué de cette promo.");
}

/*
 * What a server action hands back when it refuses.
 *
 * Throwing is no good here: Next strips the message out of production builds
 * on purpose, so every sentence written for the person in front of the screen
 * reached them as "Minified React error #441". A refusal the user is meant to
 * read is a result, not an exception — only a genuine fault should throw.
 */
export type Refus = { ok: false; message: string };

/** The name to write next to a publication, with the e-mail as a fallback. */
function signature(user: { name?: string | null; email?: string | null }) {
  return user.name?.trim() || user.email || null;
}

/*
 * Which promos the caller may moderate papers for, as labels, or null for an
 * admin, who may moderate all of them. Papers carry a filière and a niveau
 * rather than a promo id, so the comparison happens on the label the two
 * halves make up.
 */
async function porteeModeration(): Promise<string[] | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Connecte-toi pour continuer.");
  if (session.user.role === "admin") return null;
  const ids = session.user.delegations ?? [];
  if (ids.length === 0) throw new Error("Réservé à l'équipe Campusly.");
  const rows = await db
    .select({ label: classes.label })
    .from(classes)
    .where(inArray(classes.id, ids));
  return rows.map((r) => r.label);
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

/*
 * One row per device per day, counting opens. Called once when the shell
 * mounts, so it measures "someone opened the app" rather than page views —
 * which is the question actually being asked.
 *
 * The day is Cameroon's, not the server's: a visit at 23h30 local belongs to
 * that evening, and a server reasoning in UTC would file it under tomorrow.
 *
 * Failure here must never reach the reader. Counting is the least important
 * thing happening on the page.
 */
export async function enregistrerVisite(standalone = false) {
  try {
    const store = await cookies();
    const existant = store.get(DEVICE_COOKIE)?.value;
    const deviceId = existant ?? crypto.randomUUID();
    if (!existant) {
      store.set(DEVICE_COOKIE, deviceId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 2,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    const label = store.get(CLASSE_COOKIE)?.value;
    const classe = label ? await getClasseByLabel(label) : undefined;

    await db
      .insert(visites)
      .values({
        deviceId,
        classeId: classe?.id ?? null,
        jour: startOfDay(nowInWAT()),
        premiereVisite: !existant,
        standalone,
      })
      .onConflictDoUpdate({
        target: [visites.deviceId, visites.jour],
        set: {
          ouvertures: sql`${visites.ouvertures} + 1`,
          classeId: classe?.id ?? null,
          // Installed counts for the whole day once it has happened: someone
          // who opens from the home screen and later follows a link into a
          // browser tab has still installed the app.
          standalone: sql`${visites.standalone} or ${standalone}`,
          vuA: new Date(),
        },
      });
  } catch {
    // Never let the counter break the page it is counting.
  }
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

/*
 * Returns its refusals instead of throwing them. Next strips the message out
 * of an error thrown by a server action in production, so every sentence
 * written for the student — "Remplis tous les champs avant d'envoyer" —
 * reached them as React error #441 and a wall of minified text. A refusal the
 * person is meant to read has to travel as a value.
 */
export async function proposeSubject(formData: FormData): Promise<Refus | { ok: true }> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Connecte-toi pour envoyer un sujet." };
  const user = session.user;

  const filiere = String(formData.get("filiere") ?? "");
  const niveau = String(formData.get("niveau") ?? "");
  const matiere = String(formData.get("matiere") ?? "");
  const annee = String(formData.get("annee") ?? "");
  const type = String(formData.get("type") ?? "");
  const file = formData.get("file") as File | null;

  if (!filiere || !niveau || !matiere || !annee || !type) {
    return { ok: false, message: "Remplis tous les champs avant d'envoyer." };
  }
  if (!SUBJECT_TYPES.includes(type as (typeof SUBJECT_TYPES)[number])) {
    return { ok: false, message: "Type d'épreuve invalide." };
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

  // Deep-link straight to the review screen: whoever taps the notification
  // lands on the document itself, not on a queue they then have to search.
  const alerte = {
    title: "Nouveau sujet proposé",
    body: `${matiere} · ${niveau} · ${annee} — par ${user.name ?? "un étudiant"}`,
    url: `/admin/envois/${submission.id}`,
  };
  // The promo's délégué is the one who will actually review this; waiting for
  // an admin to relay it is how a paper sits in the queue for a week.
  const classeDuSujet = await getClasseByLabel(`${filiere} · ${niveau}`);
  await Promise.all([
    sendPushToAdmins(alerte),
    classeDuSujet ? sendPushToDelegues(classeDuSujet.id, alerte) : Promise.resolve(),
  ]);

  revalidatePath("/sujets/mes-envois");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export type SubjectEdits = {
  matiere: string;
  filiere: string;
  niveau: string;
  annee: string;
  type: string;
  enseignant: string;
  corrige: boolean;
  // Keeps this paper inside its own filière where promos otherwise share.
  reserveFiliere: boolean;
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
  const portee = await porteeModeration();

  const [submission] = await db
    .select()
    .from(subjectSubmissions)
    .where(eq(subjectSubmissions.id, submissionId));
  if (!submission) return;

  /*
   * A délégué answers for their own promo only — and the check covers the
   * promo the paper is published INTO as well as the one it came from, since
   * the review screen lets the filière and the niveau be corrected. Without
   * the second half, retyping the filière would be a way out of the fence.
   */
  if (portee) {
    const origine = `${submission.filiere} · ${submission.niveau}`;
    const cible = `${edits?.filiere?.trim() || submission.filiere} · ${
      edits?.niveau?.trim() || submission.niveau
    }`;
    if (!portee.includes(origine) || (decision === "publie" && !portee.includes(cible))) {
      throw new Error("Cette épreuve n'est pas de ta promo.");
    }
  }

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
      reserveFiliere: edits.reserveFiliere,
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
  debut: number;
  fin: number;
  matiere: string;
  abrege?: string;
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
  const classeLabel = String(formData.get("classeLabel") ?? "");
  const classe = await getClasseByLabel(classeLabel);
  if (!classe) throw new Error("Classe inconnue.");

  // Checked against the promo in the form, not against a role: this is where a
  // délégué of LIG 2 is stopped from rewriting BME 1's week.
  const auteur = await requireDroitSurClasse(classe.id);

  // A promo in tronc commun shows the other one's week, so anything published
  // here would be written and never read — an hour of typing into a void.
  const suit = await getTroncCommun(classe.id);
  if (suit) {
    throw new Error(
      `${classeLabel} suit le programme de ${suit.label}. Publie sur ${suit.label}, ou coupe le tronc commun d'abord.`
    );
  }

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
  const existing = await getProgrammeForWeek(classe.id, semaine, { brut: true });
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
      publiePar: signature(auteur),
    })
    .onConflictDoUpdate({
      target: [programmePublications.classeId, programmePublications.semaine],
      set: {
        weekLabel,
        salleDefaut,
        // A save without a new photo keeps the one already there.
        ...(uploaded ? { photoUrl: uploaded.url } : {}),
        publishedAt: new Date(),
        publiePar: signature(auteur),
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
      debut: c.debut,
      fin: c.fin,
      // Still written so the old column stays valid and this change stays
      // reversible; nothing reads it.
      moment: momentDuSlot(c.debut),
      matiere: c.matiere.trim(),
      abrege: c.abrege?.trim() || null,
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
    }, "programme");
  }
}

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();

  /*
   * Stamped with the promo this device is reading, not with the raw cookie:
   * someone who switches notifications on before ever opening the picker has
   * no cookie, and a null stamp means every promo-specific push skips them
   * for good — while the screen in front of them names a promo. The fallback
   * is what the programme page itself shows, so the two agree.
   */
  const classe = await getClasseByLabel(await getPreferredClasse());
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
        // Re-sent from a signed-out tab, this must not orphan a subscription
        // from the account that owns it: keep whoever is already on the row
        // when nobody is signed in now.
        userId: session?.user?.id ?? sql`${pushSubscriptions.userId}`,
        classeId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

  // This device may be the first one able to receive what this person was
  // told weeks ago. Failing here must never cost them their notifications.
  const email = session?.user?.email?.toLowerCase();
  if (email) {
    try {
      await livrerDelegationsEnAttente(email);
    } catch {
      // The row keeps its null; the next device will carry it.
    }
  }
}

/*
 * Written against the endpoint rather than the account, because the
 * preferences belong to the device: the endpoint is the only identifier a
 * signed-out browser has, and it is already unique.
 */
export async function setPushPrefs(
  endpoint: string,
  prefs: { programme?: boolean; rappel?: boolean; annales?: boolean }
) {
  await db
    .update(pushSubscriptions)
    .set({
      ...(prefs.programme === undefined ? {} : { prefProgramme: prefs.programme }),
      ...(prefs.rappel === undefined ? {} : { prefRappel: prefs.rappel }),
      ...(prefs.annales === undefined ? {} : { prefAnnales: prefs.annales }),
    })
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getPushPrefs(endpoint: string) {
  const [row] = await db
    .select({
      programme: pushSubscriptions.prefProgramme,
      rappel: pushSubscriptions.prefRappel,
      annales: pushSubscriptions.prefAnnales,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return row ?? { programme: true, rappel: true, annales: true };
}

export async function unsubscribePush(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export type ChambreInput = {
  type: string;
  surface: string;
  prixMensuel: number;
  stock: number;
};

/*
 * Creates a cité and its room types in one go.
 *
 * A cité with no room type is not a listing anyone can act on — it has no
 * price, so it cannot be sorted, filtered or compared — so the two are
 * written together rather than leaving a shell behind to be completed later.
 *
 * Photos arrive already uploaded: the form sends them to the blob store
 * first, because a form post carrying several phone photos is the one that
 * times out on a campus connection.
 */
export async function creerCite(input: {
  nom: string;
  quartier: string;
  distanceM: number;
  description: string;
  whatsapp: string;
  photos: string[];
  chambres: ChambreInput[];
}) {
  await requireAdmin();

  const nom = input.nom.trim();
  const quartier = input.quartier.trim();
  if (!nom || !quartier) throw new Error("Le nom et le quartier sont obligatoires.");
  if (!Number.isFinite(input.distanceM) || input.distanceM < 0) {
    throw new Error("Distance invalide.");
  }

  const chambres = input.chambres
    .map((c) => ({
      type: c.type.trim(),
      surface: c.surface.trim(),
      prixMensuel: Math.round(c.prixMensuel),
      stock: Math.max(0, Math.round(c.stock)),
    }))
    .filter((c) => c.type && c.prixMensuel > 0);

  if (chambres.length === 0) {
    throw new Error("Ajoute au moins un type de chambre avec un prix.");
  }

  const [cite] = await db
    .insert(cites)
    .values({
      nom,
      quartier,
      distanceM: Math.round(input.distanceM),
      description: input.description.trim(),
      whatsapp: input.whatsapp.replace(/[^0-9]/g, ""),
      photos: input.photos,
    })
    .returning({ id: cites.id });

  await db.insert(roomTypes).values(
    chambres.map((c, i) => ({ ...c, citeId: cite.id, sortOrder: i }))
  );

  revalidatePath("/admin");
  revalidatePath("/logements");
  return cite.id;
}

/*
 * Takes one photo from the form and hands back its URL. Called once per
 * photo so a slow upload fails on its own instead of taking the whole cité
 * down with it.
 */
export async function televerserPhotoCite(data: FormData) {
  await requireAdmin();
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Aucun fichier reçu.");
  const uploaded = await uploadFile(file, "cites");
  return uploaded.url;
}

/*
 * Naming a délégué.
 *
 * The e-mail is taken as given rather than checked against an existing
 * account: delegates are named the day the promo elects them, which is rarely
 * the day they first open Campusly. The right sits waiting on the address and
 * attaches itself the moment they sign in with it — so the one thing that
 * matters is that the address be the one on their Google account.
 *
 * One promo per person is the rule, and `forcer` is how the rule is broken on
 * purpose: a tronc commun like LEG 1 / GRH 1 is one timetable, so one student
 * covering both is sensible. Refusing silently, or allowing it silently, would
 * both be wrong — the caller has to say they meant it.
 */
export async function nommerDelegue(input: {
  email: string;
  classeLabel: string;
  forcer?: boolean;
}): Promise<Refus | { ok: true; prevenu: boolean }> {
  const admin = await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Adresse e-mail invalide." };
  }

  const classe = await getClasseByLabel(input.classeLabel.trim());
  if (!classe) return { ok: false, message: "Promo inconnue." };

  const existantes = await db
    .select({ classeId: delegations.classeId })
    .from(delegations)
    .where(eq(delegations.email, email));

  if (existantes.some((d) => d.classeId === classe.id)) {
    return { ok: false, message: "Elle est déjà déléguée de cette promo." };
  }
  if (existantes.length > 0 && !input.forcer) {
    return {
      ok: false,
      message: "Déjà déléguée d'une autre promo. Coche « deux promos » pour confirmer.",
    };
  }

  await db.insert(delegations).values({
    email,
    classeId: classe.id,
    nommePar: signature(admin),
  });

  /*
   * Tell them on their phone, the moment it happens. Being handed a
   * responsibility you were never told about is no responsibility at all.
   *
   * There may be nobody behind the address yet — no account, or an account
   * with notifications off — so the count comes back and the screen says which
   * it was, rather than claiming a phone buzzed when none did.
   */
  /*
   * The promo follows the role. Someone named délégué of LEG 3 is a LEG 3
   * student, so the account and every device they have switch to it — the
   * account decides which timetable they are shown, the device decides which
   * promo's notifications reach them, and a délégué reading another promo's
   * week is the one thing that must not happen.
   *
   * The promo just named wins, every time, including when two were allowed:
   * guessing which of the two is really theirs would be worse than following
   * the last instruction given.
   */
  const [compte] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`);
  if (compte) {
    await db.update(users).set({ classeId: classe.id }).where(eq(users.id, compte.id));
    await db
      .update(pushSubscriptions)
      .set({ classeId: classe.id })
      .where(eq(pushSubscriptions.userId, compte.id));
  }

  const appareils = await sendPushToEmail(email, annonceDelegation(classe.label));

  // Told, or still owed. The null is what the delivery below looks for.
  if (appareils > 0) {
    await db
      .update(delegations)
      .set({ notifieeAt: new Date() })
      .where(and(eq(delegations.email, email), eq(delegations.classeId, classe.id)));
  }

  revalidatePath("/admin");
  return { ok: true, prevenu: appareils > 0 };
}

/** One wording, so the alert reads the same whenever it finally lands. */
function annonceDelegation(label: string) {
  return {
    title: `Tu es délégué de ${label}`,
    body: "Tu peux publier l'emploi du temps de ta promo et valider les anciens sujets qu'elle envoie.",
    url: "/admin",
  };
}

/*
 * The news that was owed.
 *
 * A délégué is almost always named before they have a phone registered — that
 * is the whole point of naming on an address. Sending into the void and
 * calling it done would mean they are told by nobody. So the alert waits on
 * the row, and goes out the first time a device of theirs can receive one:
 * they switch notifications on, and the banner appears, like any other app.
 */
async function livrerDelegationsEnAttente(email: string) {
  const dues = await db
    .select({ id: delegations.id, label: classes.label })
    .from(delegations)
    .innerJoin(classes, eq(classes.id, delegations.classeId))
    .where(and(eq(delegations.email, email), isNull(delegations.notifieeAt)));

  for (const due of dues) {
    const appareils = await sendPushToEmail(email, annonceDelegation(due.label));
    if (appareils > 0) {
      await db
        .update(delegations)
        .set({ notifieeAt: new Date() })
        .where(eq(delegations.id, due.id));
    }
  }
}

export async function retirerDelegue(id: number) {
  await requireAdmin();
  await db.delete(delegations).where(eq(delegations.id, id));
  revalidatePath("/admin");
}

/*
 * A student sends the photograph of the noticeboard for their promo.
 *
 * Only a photo and a week are asked for. The sheet is already pinned up on
 * campus and perfectly readable; what is missing is someone carrying it into
 * the app. Asking for the twelve cells as well would turn a ten-second errand
 * into homework, and the proposals would stop coming.
 */
export async function proposerProgramme(
  formData: FormData
): Promise<Refus | { ok: true }> {
  const user = await requireUser();

  const classe = await getClasseByLabel(String(formData.get("classeLabel") ?? "").trim());
  if (!classe) return { ok: false, message: "Promo inconnue." };

  const semaine = mondayOf(fromISODate(String(formData.get("semaine") ?? "")));
  if (Number.isNaN(semaine.getTime())) return { ok: false, message: "Semaine invalide." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, message: "Ajoute la photo du tableau." };

  const uploaded = await uploadFile(file, "propositions");
  const note = String(formData.get("note") ?? "").trim() || null;

  await db.insert(programmePropositions).values({
    userId: user.id,
    classeId: classe.id,
    semaine,
    photoUrl: uploaded.url,
    note,
  });

  const alerte = {
    title: "Emploi du temps proposé",
    body: `${classe.label} · semaine du ${weekRangeLabel(semaine)} — par ${
      user.name ?? "un étudiant"
    }`,
    url: `/admin?tab=prog`,
  };
  await Promise.all([
    sendPushToAdmins(alerte),
    sendPushToDelegues(classe.id, alerte),
  ]);

  revalidatePath("/programme");
  revalidatePath("/admin");
  return { ok: true };
}

/*
 * Answering a proposal. The promo on the proposal decides who may answer, so
 * a délégué of LIG 2 can neither publish nor refuse BME 1's week, while an
 * admin answers anywhere.
 *
 * Publishing writes the photo as that week's programme and leaves the grid
 * empty: the week is readable immediately, and whoever has a minute can
 * transcribe the cells afterwards in the grid, which keeps the photo.
 */
export async function repondreProposition(
  propositionId: number,
  decision: "publie" | "refuse",
  note?: string
): Promise<Refus | { ok: true }> {
  const [proposition] = await db
    .select()
    .from(programmePropositions)
    .where(eq(programmePropositions.id, propositionId));
  if (!proposition) return { ok: false, message: "Cette proposition n'existe plus." };

  let auteur;
  try {
    auteur = await requireDroitSurClasse(proposition.classeId);
  } catch {
    return { ok: false, message: "Cette promo n'est pas la tienne." };
  }

  if (decision === "publie") {
    const [classe] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, proposition.classeId));
    const existing = await getProgrammeForWeek(proposition.classeId, proposition.semaine, { brut: true });
    const weekLabel = existing?.weekLabel ?? `Semaine ${weekRangeLabel(proposition.semaine)}`;

    await db
      .insert(programmePublications)
      .values({
        classeId: proposition.classeId,
        semaine: proposition.semaine,
        weekLabel,
        photoUrl: proposition.photoUrl,
        publiePar: signature(auteur),
      })
      .onConflictDoUpdate({
        target: [programmePublications.classeId, programmePublications.semaine],
        set: {
          photoUrl: proposition.photoUrl,
          publishedAt: new Date(),
          publiePar: signature(auteur),
        },
      });

    // Same rule as the grid: a promo is told once, when the week appears, and
    // never again when someone swaps in a sharper photograph.
    if (!existing && classe) {
      await sendPushToClasse(
        proposition.classeId,
        {
          title: `Programme de la semaine — ${classe.label}`,
          body: weekLabel,
          url: "/programme",
        },
        "programme"
      );
    }
  }

  await db
    .update(programmePropositions)
    .set({
      status: decision,
      reponsePar: signature(auteur),
      reponseNote: note?.trim() || null,
      reviewedAt: new Date(),
    })
    .where(eq(programmePropositions.id, propositionId));

  // The student who took the trouble hears what became of it.
  await sendPushToUser(proposition.userId, {
    title: decision === "publie" ? "Ton emploi du temps est en ligne" : "Proposition refusée",
    body:
      decision === "publie"
        ? "Merci — toute ta promo l'a maintenant."
        : note?.trim() || "Cette photo n'a pas pu être publiée.",
    url: "/programme",
  });

  revalidatePath("/programme");
  revalidatePath("/admin");
  return { ok: true };
}

/*
 * End of the academic year: the délégués elected last year are not the ones
 * who will be elected next. Clearing the list in one gesture is safer than
 * twelve removals, half of which get forgotten.
 */
export async function viderDelegues() {
  await requireAdmin();
  await db.delete(delegations);
  revalidatePath("/admin");
}

/*
 * Declares that a promo sits in the same room as another, or takes the
 * declaration back.
 *
 * Admin only, and deliberately not open to a délégué: a tronc commun is a
 * fact about the faculty's timetable, not about one promo, and the person who
 * would get it wrong is the one who only sees their own.
 */
export async function definirTroncCommun(
  classeLabel: string,
  sourceLabel: string | null
): Promise<Refus | { ok: true }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { ok: false, message: "Réservé à l'équipe Campusly." };
  }

  const classe = await getClasseByLabel(classeLabel);
  if (!classe) return { ok: false, message: "Promo inconnue." };

  let sourceId: number | null = null;
  if (sourceLabel) {
    const source = await getClasseByLabel(sourceLabel);
    if (!source) return { ok: false, message: "Promo source inconnue." };
    sourceId = source.id;
  }

  const r = await definirProgrammeDe(classe.id, sourceId);
  if (!r.ok) return r;

  revalidatePath("/admin");
  revalidatePath("/programme");
  revalidatePath("/");
  return { ok: true };
}

export type EpreuveEnLot = {
  matiere: string;
  annee: string;
  type: string;
  enseignant: string;
};

export type ResultatLot = {
  ok: true;
  publiees: number;
  refusees: { matiere: string; message: string }[];
};

/*
 * Publishes a drawer's worth of past papers in one go.
 *
 * A délégué emptying a cupboard has twenty sheets of the same promo, the same
 * year and the same kind; doing them one at a time means twenty trips through
 * a form where only the matière changes, and in practice it means they stop
 * after four. So the promo and the labels that repeat are chosen once, and
 * each sheet carries only what is its own.
 *
 * Partial success is the honest outcome here: one unreadable file among
 * twenty must not throw away the other nineteen, and the ones that failed are
 * named back so they can be retried rather than silently lost.
 */
export async function publierEpreuves(formData: FormData): Promise<Refus | ResultatLot> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Connecte-toi pour continuer." };

  const classeLabel = String(formData.get("classeLabel") ?? "").trim();
  const classe = await getClasseByLabel(classeLabel);
  if (!classe) return { ok: false, message: "Promo inconnue." };

  // The same fence as everywhere else: a délégué publishes for their promo
  // and no other, whatever the form was made to say.
  if (session.user.role !== "admin" && !session.user.delegations?.includes(classe.id)) {
    return { ok: false, message: "Tu n'es pas délégué de cette promo." };
  }

  const [filiere, niveau] = classeLabel.split(" · ");
  if (!filiere || !niveau) return { ok: false, message: "Promo mal formée." };

  let lignes: EpreuveEnLot[] = [];
  try {
    lignes = JSON.parse(String(formData.get("epreuves") ?? "[]")) as EpreuveEnLot[];
  } catch {
    return { ok: false, message: "Liste illisible." };
  }
  if (lignes.length === 0) return { ok: false, message: "Ajoute au moins une épreuve." };

  const refusees: { matiere: string; message: string }[] = [];
  let publiees = 0;

  for (const [i, ligne] of lignes.entries()) {
    const matiere = ligne.matiere.trim();
    const annee = ligne.annee.trim();
    const nom = matiere || `Épreuve ${i + 1}`;

    if (!matiere || !annee) {
      refusees.push({ matiere: nom, message: "Matière et année obligatoires." });
      continue;
    }
    if (!SUBJECT_TYPES.includes(ligne.type as (typeof SUBJECT_TYPES)[number])) {
      refusees.push({ matiere: nom, message: "Type d'épreuve invalide." });
      continue;
    }

    const file = formData.get(`fichier-${i}`);
    if (!(file instanceof File) || file.size === 0) {
      refusees.push({ matiere: nom, message: "Fichier manquant." });
      continue;
    }

    try {
      const uploaded = await uploadFile(file, "sujets");
      await db.insert(subjects).values({
        matiere,
        filiere,
        niveau,
        annee,
        type: ligne.type as (typeof SUBJECT_TYPES)[number],
        enseignant: ligne.enseignant.trim() || null,
        fileUrl: uploaded.url,
        fileName: uploaded.name,
      });
      publiees += 1;
    } catch (e) {
      refusees.push({ matiere: nom, message: e instanceof Error ? e.message : "Envoi impossible." });
    }
  }

  if (publiees > 0) {
    await ensureClassesForFiliere(filiere, niveau);

    /*
     * One alert for the batch, not one per sheet: twenty buzzes in a row is
     * how a promo turns notifications off for good.
     *
     * It goes to every promo that will actually see these papers, the tronc
     * commun included — telling only the promo they were filed under would
     * leave the others to find them by chance, which defeats the sharing.
     */
    const reussies = lignes
      .map((l) => l.matiere.trim())
      .filter((m) => m && !refusees.some((r) => r.matiere === m));
    const apercu = reussies.slice(0, 3).join(", ");
    const reste = reussies.length - 3;
    const payload = {
      title:
        publiees === 1 ? "Une nouvelle épreuve" : `${publiees} nouvelles épreuves`,
      body: `${apercu}${reste > 0 ? ` et ${reste} autre${reste > 1 ? "s" : ""}` : ""} · ${niveau}`,
      url: `/sujets?filiere=${encodeURIComponent(filiere)}&niveau=${encodeURIComponent(niveau)}`,
    };
    const destinataires = await getClassesQuiVoient(filiere, niveau);
    // One promo failing to notify must not lose the publication itself.
    try {
      await Promise.all(destinataires.map((c) => sendPushToClasse(c.id, payload, "annales")));
    } catch {
      /* les épreuves sont en ligne, c'est ce qui compte */
    }

    revalidatePath("/sujets");
    revalidatePath("/admin");
  }

  return { ok: true, publiees, refusees };
}
