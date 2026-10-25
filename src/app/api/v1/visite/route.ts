import { NextResponse } from "next/server";
import { enregistrerVisite } from "@/lib/actions";
import { corps } from "@/lib/api";

export const dynamic = "force-dynamic";

// Counted as an installed visit: the app is the installed Campusly.
export async function POST(request: Request) {
  const body = await corps<{ notif?: string }>(request);
  await enregistrerVisite(true, body?.notif ?? null);
  return new NextResponse(null, { status: 204 });
}
