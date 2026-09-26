import { NextResponse } from "next/server";
import { envoyerRappelsDuSoir } from "@/lib/rappel";

export const dynamic = "force-dynamic";

/*
 * Fired once a day at 19:00 UTC — 20h in Yaoundé — by the cron declared in
 * vercel.json. One firing a day is all the free plan allows, and all this
 * needs: the "class in 10 minutes" alert would have required a run every five
 * minutes, so a paid plan, for the least useful of the reminders.
 *
 * Vercel sends CRON_SECRET as a bearer token. Without the check the route is
 * a public button anyone could press to push a notification to every promo.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const result = await envoyerRappelsDuSoir();
  return NextResponse.json({ ok: true, ...result });
}
