import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { evenements, users } from "@/db/schema";
import { lireJeton } from "@/lib/jeton";
import { sendPushToAdmins } from "@/lib/push";

/*
 * Who may read a Sujet's content, and how much of it.
 *
 * The page of a Sujet is public — what it is, its year, its Thèmes — so it can
 * be found. Its content (the text, the photographs, the PDF) is for a
 * signed-in account, and an account opens at most QUOTA different Sujets in
 * any 24 hours. A student revising reads a handful; a script emptying the
 * catalogue reads them all, and that is what this stops. A Sujet already
 * opened today stays open, however often it is read again.
 */
export const QUOTA = 20;
const JOUR = 24 * 60 * 60 * 1000;

export type Acces = { ok: true; userId: string } | { ok: false; raison: "connexion" | "quota" };

/** The account behind a request: its session (web, or the app's bearer), else a signed link. */
export async function lecteur(jeton?: string | null): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? lireJeton(jeton);
}

export async function ouvrir(userId: string | null, subjectId: number): Promise<Acces> {
  if (!userId) return { ok: false, raison: "connexion" };
  const depuis = new Date(Date.now() - JOUR);
  const lus = await db
    .selectDistinct({ id: evenements.cibleId })
    .from(evenements)
    .where(and(eq(evenements.type, "lecture"), eq(evenements.userId, userId), gt(evenements.createdAt, depuis)));
  if (lus.some((l) => l.id === subjectId)) return { ok: true, userId };

  // Admins check papers for a living; the limit is for everyone else.
  const [compte] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!compte) return { ok: false, raison: "connexion" };
  if (compte.role !== "admin" && lus.length >= QUOTA) {
    await signalerQuota(userId, subjectId, depuis);
    return { ok: false, raison: "quota" };
  }

  await db.insert(evenements).values({ type: "lecture", cible: "sujet", cibleId: subjectId, userId });
  return { ok: true, userId };
}

// Once per account per day: the first refusal tells the admins, the next ones only refuse.
async function signalerQuota(userId: string, subjectId: number, depuis: Date) {
  const [deja] = await db
    .select({ id: evenements.id })
    .from(evenements)
    .where(and(eq(evenements.type, "quota_atteint"), eq(evenements.userId, userId), gt(evenements.createdAt, depuis)))
    .limit(1);
  if (deja) return;
  await db.insert(evenements).values({ type: "quota_atteint", cible: "sujet", cibleId: subjectId, userId });
  const [u] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId));
  await sendPushToAdmins({
    title: "Limite de Sujets atteinte",
    body: `${u?.name ?? u?.email ?? "Un compte"} a ouvert ${QUOTA} Sujets en 24 h et vient d'être bloqué. Copie en masse ?`,
    url: "/admin",
  }).catch(() => 0);
}

/** The account part of the mark a downloaded PDF carries: matched against sha256 of user ids. */
export const empreinte = (userId: string) => createHash("sha256").update(userId).digest("hex").slice(0, 10);
