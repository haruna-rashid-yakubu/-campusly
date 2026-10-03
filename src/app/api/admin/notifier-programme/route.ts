import { NextResponse } from "next/server";
import { getClasseByLabel, getProgrammeForWeek } from "@/lib/data";
import { sendPushToClasse } from "@/lib/push";
import { fromISODate, mondayOf } from "@/lib/semaine";

export const dynamic = "force-dynamic";

/*
 * Announces a week that was written straight into the database rather than
 * through the admin screen. The push lives in the save action, so a row
 * inserted by hand reaches students' phones only if something else rings the
 * bell — this is that something.
 *
 * Behind CRON_SECRET, like the evening reminder: without it this is a public
 * button that notifies every promo on the campus.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const label = searchParams.get("classe") ?? "";
  const semaineParam = searchParams.get("semaine") ?? "";

  const classe = await getClasseByLabel(label);
  if (!classe) return NextResponse.json({ error: "Classe inconnue." }, { status: 404 });

  const semaine = mondayOf(fromISODate(semaineParam));
  if (Number.isNaN(semaine.getTime())) {
    return NextResponse.json({ error: "Semaine invalide." }, { status: 400 });
  }

  // Never announce a week that is not there: the notification would open on an
  // empty screen, which is worse than no notification.
  const programme = await getProgrammeForWeek(classe.id, semaine);
  if (!programme) {
    return NextResponse.json({ error: "Aucun programme pour cette semaine." }, { status: 404 });
  }

  await sendPushToClasse(
    classe.id,
    {
      title: `Programme de la semaine — ${classe.label}`,
      body: programme.weekLabel,
      url: "/programme",
    },
    "programme"
  );

  return NextResponse.json({ ok: true, classe: classe.label, semaine: semaineParam });
}
