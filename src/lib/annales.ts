import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { notificationsAnnales, subjects } from "@/db/schema";
import { getClassesQuiVoient } from "@/lib/data";
import { sendPushToClasse } from "@/lib/push";

/*
 * Rings the bell for past papers that reached the bank without the admin
 * screen, whose publishing action sends its own alert.
 *
 * It counts the rows itself rather than trusting a number it is given, so the
 * alert can only ever announce papers that are really online — a notification
 * that overstates is worse than none, because it is the last one a student
 * leaves switched on.
 */
export async function notifierAnnales(filiere: string, niveau: string, depuis: Date) {
  const nouvelles = await db
    .select({ matiere: subjects.matiere })
    .from(subjects)
    .where(
      and(eq(subjects.filiere, filiere), eq(subjects.niveau, niveau), gte(subjects.createdAt, depuis))
    )
    .orderBy(subjects.createdAt);

  if (nouvelles.length === 0) return null;

  // Distinct subjects, not rows: two sittings of Politiques Économiques read
  // as one line in the alert, which is how a student reads the list anyway.
  const matieres = [...new Set(nouvelles.map((n) => n.matiere))];
  const apercu = matieres.slice(0, 3).join(", ");
  const reste = matieres.length - 3;

  const payload = {
    title:
      nouvelles.length === 1 ? "Une nouvelle épreuve" : `${nouvelles.length} nouvelles épreuves`,
    body: `${apercu}${reste > 0 ? ` et ${reste} autre${reste > 1 ? "s" : ""}` : ""} · ${niveau}`,
    url: `/sujets?filiere=${encodeURIComponent(filiere)}&niveau=${encodeURIComponent(niveau)}`,
  };

  // Every promo that will actually see these papers, the tronc commun
  // included — the same reach the admin screen gives.
  const destinataires = await getClassesQuiVoient(filiere, niveau);
  await Promise.all(destinataires.map((c) => sendPushToClasse(c.id, payload, "annales")));

  return { epreuves: nouvelles.length, classes: destinataires.map((c) => c.label), payload };
}

/*
 * Sends the held alerts whose time has come. Each one is stamped before it
 * goes out, by a conditional update only one run can win, so a cron retried
 * by Vercel cannot send it twice; an alert lost to a failure in between is
 * the lesser harm.
 */
export async function envoyerAnnalesProgrammees(maintenant = new Date(), { sansAttendre = false } = {}) {
  // `sansAttendre`: the admin's button, which sends what is held now rather than at its hour.
  const dues = await db
    .select()
    .from(notificationsAnnales)
    .where(
      sansAttendre
        ? isNull(notificationsAnnales.envoyeeLe)
        : and(isNull(notificationsAnnales.envoyeeLe), lte(notificationsAnnales.envoyerApres, maintenant))
    );

  const envoyees = [];
  for (const n of dues) {
    const [pris] = await db
      .update(notificationsAnnales)
      .set({ envoyeeLe: maintenant })
      .where(and(eq(notificationsAnnales.id, n.id), isNull(notificationsAnnales.envoyeeLe)))
      .returning({ id: notificationsAnnales.id });
    if (!pris) continue;
    const r = await notifierAnnales(n.filiere, n.niveau, n.depuis);
    envoyees.push({ id: n.id, promo: `${n.filiere} · ${n.niveau}`, epreuves: r?.epreuves ?? 0 });
  }
  return { envoyees };
}
