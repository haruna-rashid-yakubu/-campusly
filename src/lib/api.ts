import { NextResponse } from "next/server";
import type { Vendeur } from "@/lib/vendeurs";

/*
 * Shared by the /api/v1 routes the native app reads. The routes call the same
 * data functions and server actions the pages do — proxy.ts turns the app's
 * headers back into the cookies those expect — so all that lives here is the
 * JSON plumbing.
 */

export function introuvable() {
  return NextResponse.json({ error: "Introuvable" }, { status: 404 });
}

export function invalide(message = "Requête invalide") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function corps<T>(request: Request): Promise<T | null> {
  return (await request.json().catch(() => null)) as T | null;
}

export function entier(valeur: string) {
  const n = Number(valeur);
  return Number.isInteger(n) ? n : null;
}

// The shop's private link is its owner's key to mark orders; it never leaves the server.
export function vendeurPublic(v: Vendeur) {
  const { tokenEspace: _secret, ...reste } = v;
  void _secret;
  return reste;
}
