import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/auth";
import { evenementCibleEnum, evenementTypeEnum, evenements } from "@/db/schema";

export const dynamic = "force-dynamic";

/*
 * Records one action: a landlord contacted, or the app shared.
 *
 * A route handler rather than a Server Action, for one reason that decides it:
 * the tap that reports a contact is the same tap that opens WhatsApp, so the
 * page is about to be put to sleep. `sendBeacon` is built for exactly that —
 * the browser carries the request to completion after the page is gone — and
 * it can only post to a URL. A Server Action would also queue behind any other
 * action in flight, since Next dispatches them one at a time per client, and a
 * counter must never make a button feel slow.
 *
 * The reply is 204 whatever happens. Losing a count is a blemish on a
 * statistic; delaying the person's WhatsApp is a broken button.
 */
export async function POST(request: Request) {
  try {
    const corps = (await request.json()) as Record<string, unknown>;

    const type = String(corps.type ?? "");
    const cible = String(corps.cible ?? "");
    if (!evenementTypeEnum.includes(type as (typeof evenementTypeEnum)[number])) {
      return new NextResponse(null, { status: 204 });
    }
    if (!evenementCibleEnum.includes(cible as (typeof evenementCibleEnum)[number])) {
      return new NextResponse(null, { status: 204 });
    }

    const brut = Number(corps.cibleId);
    const cibleId = Number.isInteger(brut) && brut > 0 ? brut : null;

    // A channel is a label on our own buttons, not free text from the wire.
    const canaux = ["statut", "systeme", "whatsapp", "copie"];
    const canalBrut = String(corps.canal ?? "");
    const canal = canaux.includes(canalBrut) ? canalBrut : null;

    const session = await auth();

    await db.insert(evenements).values({
      type: type as (typeof evenementTypeEnum)[number],
      cible: cible as (typeof evenementCibleEnum)[number],
      cibleId,
      canal,
      userId: session?.user?.id ?? null,
    });
  } catch {
    /* un compteur ne casse jamais la page qui l'appelle */
  }

  return new NextResponse(null, { status: 204 });
}
