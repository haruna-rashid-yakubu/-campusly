import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { empreinte, lecteur, ouvrir } from "@/lib/acces";
import { cles, lire } from "@/lib/numerisation/r2";

/*
 * Serves a past paper with Campusly's mark on it (see lib/fichiers), to a
 * signed-in account within its daily limit (lib/acces). Without one, a
 * browser is sent to the Sujet's page, which says why and offers to sign in.
 *
 * Nothing is added that a reader can see: the page stays exactly as it was
 * photographed. The mark is a code — CPL-<paper>-<account>-<day> — written in
 * the document's properties and as transparent text on each page, so it
 * survives a re-save. <account> is the first characters of sha256(user id):
 * it names no one on the file, but the admins can find whose it is.
 *
 * The stored original is never handed out: its address is a public blob.
 * A paper not yet digitised is fetched here and served from here, or not
 * at all when it is too large for a function's response.
 */
const LIMITE = 4 * 1024 * 1024;

export async function GET(request: Request, ctx: { params: Promise<{ id: string; nom: string }> }) {
  const { id, nom } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) return new NextResponse(null, { status: 404 });

  const [row] = await db
    .select({ fileUrl: subjects.fileUrl, correctionUrl: subjects.correctionUrl })
    .from(subjects)
    .where(eq(subjects.id, numero));
  const corrige = params.get("c") === "1";
  const source = corrige ? row?.correctionUrl : row?.fileUrl;
  if (!source) return new NextResponse(null, { status: 404 });

  // The digitisation script (scripts/numeriser.ts) reads with the deployment's secret, outside any account's day.
  const secret = process.env.CRON_SECRET;
  const systeme = !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
  const acces = systeme ? ({ ok: true, userId: "systeme" } as const) : await ouvrir(await lecteur(params.get("t")), numero);
  if (!acces.ok) {
    const page = new URL(`/sujets/${numero}`, request.url);
    // The app's API and scripts get the reason; a browser gets the page that explains it.
    return (request.headers.get("accept") ?? "").includes("text/html")
      ? NextResponse.redirect(page)
      : NextResponse.json({ erreur: acces.raison }, { status: acces.raison === "quota" ? 429 : 401 });
  }

  const telecharger = params.get("download") === "1";
  const jour = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const code = `CPL-${numero}-${systeme ? "systeme" : empreinte(acces.userId)}-${jour}`;

  // The digitised versions in R2 first: the Version reconstituée, or the
  // Version originale with ?o=1. The file as first published while a paper
  // has not been digitised.
  const cle = params.get("o") === "1" ? cles.originale(numero, corrige) : cles.reconstituee(numero, corrige);
  let octets = await lire(cle).catch(() => null);
  let type = "application/pdf";
  if (!octets) {
    const original = await fetch(source).catch(() => null);
    if (!original?.ok) return new NextResponse(null, { status: 404 });
    octets = new Uint8Array(await original.arrayBuffer());
    type = original.headers.get("content-type") ?? "application/octet-stream";
  }
  if (octets.byteLength > LIMITE) return new NextResponse("Fichier trop lourd pour être servi.", { status: 503 });

  const fichier = decodeURIComponent(nom).replace(/[^\w.-]/g, "_");
  const entetes = {
    "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="${fichier}"`,
    "Cache-Control": "private, no-store",
  };
  // A photograph published as is: nothing to mark.
  if (!type.includes("pdf")) {
    return new NextResponse(Buffer.from(octets), { headers: { ...entetes, "Content-Type": type, "Content-Disposition": "inline" } });
  }

  let marque: Uint8Array;
  try {
    const pdf = await PDFDocument.load(octets, { ignoreEncryption: true });
    const police = await pdf.embedFont(StandardFonts.Helvetica);
    for (const page of pdf.getPages()) {
      page.drawText(code, { x: 2, y: 2, size: 2, font: police, color: rgb(1, 1, 1), opacity: 0 });
    }
    pdf.setProducer("Campusly");
    pdf.setCreator("Campusly · www.mycampusly.fr");
    pdf.setKeywords([code]);
    marque = await pdf.save();
  } catch {
    // Unreadable to pdf-lib: served as it is, still only to this account.
    marque = octets;
  }

  return new NextResponse(Buffer.from(marque), { headers: { ...entetes, "Content-Type": "application/pdf" } });
}
