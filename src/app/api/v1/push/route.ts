import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { isExpoToken } from "@/lib/push";

export const dynamic = "force-dynamic";

type Body = {
  token?: string;
  classeId?: number | null;
  prefs?: { programme?: boolean; rappel?: boolean; annales?: boolean };
};

async function lire(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  return body?.token && isExpoToken(body.token) ? { ...body, token: body.token } : null;
}

/*
 * Registers this phone, or refreshes it. Signing in is optional, as on the
 * web: the promo the app shows is stamped on the row so a signed-out phone
 * still gets its own programme.
 */
export async function POST(request: Request) {
  const body = await lire(request);
  if (!body) return NextResponse.json({ error: "Jeton Expo invalide" }, { status: 400 });
  const user = await getMobileUser(request);
  const classeId = body.classeId ?? null;

  await db
    .insert(pushSubscriptions)
    // Web-push keys have no meaning for an Expo token.
    .values({ userId: user?.id ?? null, classeId, endpoint: body.token, p256dh: "", auth: "" })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        // A signed-out refresh must not orphan the row from its account.
        userId: user?.id ?? sql`${pushSubscriptions.userId}`,
        classeId,
      },
    });
  return new NextResponse(null, { status: 204 });
}

// Per-device notification preferences, keyed on the token like the web's endpoint.
export async function PATCH(request: Request) {
  const body = await lire(request);
  if (!body?.prefs) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { programme, rappel, annales } = body.prefs;
  await db
    .update(pushSubscriptions)
    .set({
      ...(programme === undefined ? {} : { prefProgramme: programme }),
      ...(rappel === undefined ? {} : { prefRappel: rappel }),
      ...(annales === undefined ? {} : { prefAnnales: annales }),
    })
    .where(eq(pushSubscriptions.endpoint, body.token));
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: Request) {
  const body = await lire(request);
  if (!body) return NextResponse.json({ error: "Jeton Expo invalide" }, { status: 400 });
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.token));
  return new NextResponse(null, { status: 204 });
}
