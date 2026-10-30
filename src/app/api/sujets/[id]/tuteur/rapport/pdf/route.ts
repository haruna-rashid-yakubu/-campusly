import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { ouvrir } from "@/lib/acces";
import { imprimerPdf } from "@/lib/pdf-serveur";
import { gabaritRapport, piedRapport } from "@/lib/rapport";

/*
 * The revision report written by ../ (its parts, kept by the phone), printed
 * to PDF with a Campusly cover in the student's name, for an account allowed
 * to read the Sujet.
 */
export const maxDuration = 60;

const TAILLE_MAX = 200_000;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const numero = Number((await ctx.params).id);
  if (!Number.isInteger(numero) || numero <= 0) return new NextResponse(null, { status: 404 });

  const session = await auth();
  const acces = await ouvrir(session?.user?.id ?? null, numero);
  if (!acces.ok) return NextResponse.json({ erreur: acces.raison }, { status: acces.raison === "quota" ? 429 : 401 });

  const corps = (await request.json().catch(() => null)) as { parties?: { id?: string; exercices?: string[]; texte?: string }[]; avecCours?: boolean } | null;
  const parties = (corps?.parties ?? [])
    .filter((p) => typeof p?.id === "string" && typeof p.texte === "string")
    .map((p) => ({ id: p.id!, exercices: (p.exercices ?? []).map(String), texte: p.texte! }));
  const taille = parties.reduce((n, p) => n + p.texte.length, 0);
  if (!parties.length || taille > TAILLE_MAX) return NextResponse.json({ erreur: "rapport" }, { status: 400 });

  const [s] = await db
    .select({ matiere: subjects.matiere, filiere: subjects.filiere, niveau: subjects.niveau, annee: subjects.annee, type: subjects.type })
    .from(subjects)
    .where(eq(subjects.id, numero));
  if (!s) return new NextResponse(null, { status: 404 });

  const eleve = session?.user?.name || session?.user?.email?.split("@")[0] || "toi";
  try {
    const pdf = await imprimerPdf(gabaritRapport({ ...s, eleve, avecCours: corps?.avecCours === true }, parties), piedRapport(s.matiere, eleve));
    const nom = `Rapport de révision - ${s.matiere}`.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 80);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport.pdf"; filename*=UTF-8''${encodeURIComponent(nom)}.pdf`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("rapport pdf", e);
    return NextResponse.json({ erreur: "pdf" }, { status: 500 });
  }
}
