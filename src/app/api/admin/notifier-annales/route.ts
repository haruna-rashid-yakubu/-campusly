import { NextResponse } from "next/server";
import { notifierAnnales } from "@/lib/annales";

export const dynamic = "force-dynamic";

/*
 * Rings the bell for past papers that were filed straight through
 * /api/admin/sujet instead of the admin screen.
 *
 * The batch alert lives inside the publishing action, so a drawer emptied by
 * the back door lands online in silence: the promo it was collected for never
 * learns it is there. This is the counterpart, exactly as notifier-programme
 * is the counterpart of saving a week by hand. To send it later instead, add
 * a row to notification_annales: the morning cron picks it up.
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

  const r = await notifierAnnales(filiere, niveau, depuis);
  if (!r) {
    return NextResponse.json(
      { error: "Aucune épreuve publiée depuis cette date." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ...r });
}
