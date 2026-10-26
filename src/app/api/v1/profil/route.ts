import { NextResponse } from "next/server";
import { enregistrerProfil, getProfilCourant } from "@/lib/actions";
import { corps, invalide } from "@/lib/api";

export const dynamic = "force-dynamic";

// The device comes from X-Campusly-Device and the account from the bearer, through proxy.ts.
export async function GET() {
  return NextResponse.json(await getProfilCourant());
}

export async function PUT(request: Request) {
  const body = await corps<{ prenom?: string; nom?: string; telephone?: string }>(request);
  if (!body) return invalide();
  return NextResponse.json(await enregistrerProfil(body));
}
