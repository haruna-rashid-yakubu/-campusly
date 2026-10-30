import { NextResponse } from "next/server";
import { lecteur } from "@/lib/acces";
import { cles, lire } from "@/lib/numerisation/r2";

/*
 * A Sujet d'entraînement's PDF, or its corrigé with ?c=1, to a signed-in
 * account (the session, or the link signed for it: lib/jeton). A browser
 * without one is sent to the paper's page, which offers to sign in.
 */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string; n: string; nom: string }> }) {
  const { slug, n, nom } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const numero = Number(n);
  if (!/^[a-z0-9-]+$/.test(slug) || !Number.isInteger(numero) || numero < 1 || numero > 5) {
    return new NextResponse(null, { status: 404 });
  }

  if (!(await lecteur(params.get("t")))) {
    return (request.headers.get("accept") ?? "").includes("text/html")
      ? NextResponse.redirect(new URL(`/entrainement/${slug}/${numero}`, request.url))
      : NextResponse.json({ erreur: "connexion" }, { status: 401 });
  }

  const octets = await lire(cles.entrainementPdf(slug, numero, params.get("c") === "1")).catch(() => null);
  if (!octets) return new NextResponse(null, { status: 404 });
  const fichier = decodeURIComponent(nom).replace(/[^\w.-]/g, "_");
  return new NextResponse(Buffer.from(octets), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${params.get("download") === "1" ? "attachment" : "inline"}; filename="${fichier}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
