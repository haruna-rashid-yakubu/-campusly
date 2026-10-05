import { NextResponse } from "next/server";
import { sendPushToAdmins } from "@/lib/push";

export const dynamic = "force-dynamic";

/*
 * Rings the admins' phones on demand.
 *
 * "Did it go out?" could only ever be answered by waiting for 20h and hoping.
 * This fires the same machinery — same service worker, same push service, same
 * sound — at a moment of one's choosing, so a silence can be told apart from a
 * fault within seconds rather than a day.
 *
 * Admins only: a public button that pushes to every promo is exactly what the
 * bearer check exists to prevent.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const atteints = await sendPushToAdmins({
    title: searchParams.get("titre") || "Campusly — test",
    body: searchParams.get("corps") || "Si tu lis ceci, les notifications fonctionnent.",
    url: searchParams.get("url") || "/admin",
  });

  return NextResponse.json({ ok: true, appareils: atteints });
}
