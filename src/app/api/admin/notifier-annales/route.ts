import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getClassesQuiVoient } from "@/lib/data";
import { sendPushToClasse } from "@/lib/push";

export const dynamic = "force-dynamic";

/*
 * Rings the bell for past papers that were filed straight through
 * /api/admin/sujet instead of the admin screen.
 *
 * The batch alert lives inside the publishing action, so a drawer emptied by
 * the back door lands online in silence: the promo it was collected for never
 * learns it is there. This is the counterpart, exactly as notifier-programme
 * is the counterpart of saving a week by hand.
 *
 * It counts the rows itself rather than trusting a number in the query, so the
 * alert can only ever announce papers that are really online — a notification
 * that overstates is worse than none, because it is the last one a student
 * leaves switched on.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filiere = (searchParams.get("filiere") ?? "").trim();
  const niveau = (searchParams.get("niveau") ?? "").trim();
  const depuis = new Date(searchParams.get("depuis") ?? "");

  if (!filiere || !niveau) {
    return NextResponse.json({ error: "filiere et niveau sont obligatoires." }, { status: 400 });
  }
  if (Number.isNaN(depuis.getTime())) {
    return NextResponse.json(
      { error: "depuis doit être une date ISO (ex. 2026-10-06T20:00:00Z)." },
      { status: 400 }
    );
  }

  const nouvelles = await db
    .select({ matiere: subjects.matiere })
    .from(subjects)
    .where(
      and(eq(subjects.filiere, filiere), eq(subjects.niveau, niveau), gte(subjects.createdAt, depuis))
    )
    .orderBy(subjects.createdAt);

  if (nouvelles.length === 0) {
    return NextResponse.json(
      { error: "Aucune épreuve publiée depuis cette date." },
      { status: 404 }
    );
  }

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

  return NextResponse.json({
    ok: true,
    epreuves: nouvelles.length,
    classes: destinataires.map((c) => c.label),
    payload,
  });
}
