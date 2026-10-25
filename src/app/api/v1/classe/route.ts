import { NextResponse } from "next/server";
import { setClasse } from "@/lib/actions";
import { corps, invalide } from "@/lib/api";

export const dynamic = "force-dynamic";

// Mirrors the promo the app picked onto the account, so the evening crons reach it.
export async function POST(request: Request) {
  const body = await corps<{ label?: string }>(request);
  if (!body?.label) return invalide();
  await setClasse(body.label);
  return new NextResponse(null, { status: 204 });
}
