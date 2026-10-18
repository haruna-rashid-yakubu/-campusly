import { NextResponse } from "next/server";
import { envoyerAnnalesProgrammees } from "@/lib/annales";
import { alerterCreneauxVides } from "@/lib/rappel";
import { jourOf, nowInWAT } from "@/lib/semaine";

export const dynamic = "force-dynamic";

/*
 * Fired once a day at 07:00 UTC — 8h in Yaoundé — by the cron declared in
 * vercel.json. On the free plan Vercel may start it any time within that
 * hour. It sends only what was held for the morning, so most days it does
 * nothing at all.
 *
 * Vercel sends CRON_SECRET as a bearer token, as for the evening reminder.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const result = await envoyerAnnalesProgrammees();
  // Sunday morning: the second warning to the admins, a day after Saturday's.
  const creneaux = jourOf(nowInWAT()) === 7 ? await alerterCreneauxVides() : null;
  return NextResponse.json({ ok: true, ...result, creneaux });
}
