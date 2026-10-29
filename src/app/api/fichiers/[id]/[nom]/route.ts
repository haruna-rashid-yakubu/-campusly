import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { DEVICE_COOKIE } from "@/lib/constants";
import { cles, lire } from "@/lib/numerisation/r2";

/*
 * Serves a past paper with Campusly's mark on it (see lib/fichiers).
 *
 * Nothing is added that a reader can see: the page stays exactly as it was
 * photographed. The mark is a code — CPL-<paper>-<phone>-<day> — written in the document's
 * properties and as transparent text on each page, so it survives a re-save.
 * <phone> is a short hash of the anonymous device cookie, "web" for the
 * preview Google renders: it names no one, but a hash of a device id taken
 * from the visits table can be checked against it.
 *
 * A file too large for a function's response, or one pdf-lib cannot open,
 * goes out unmarked rather than not at all.
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
  const source = params.get("c") === "1" ? row?.correctionUrl : row?.fileUrl;
  if (!source) return new NextResponse(null, { status: 404 });

  const apercu = params.get("v") === "1";
  const telecharger = params.get("download") === "1";
  const appareil = apercu ? null : (await cookies()).get(DEVICE_COOKIE)?.value;
  const qui = appareil ? createHash("sha256").update(appareil).digest("hex").slice(0, 10) : "web";
  const jour = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const code = `CPL-${numero}-${qui}-${jour}`;

  // The digitised versions in R2 first: the Version reconstituée, or the
  // Version originale with ?o=1. The file as first published is the fallback
  // while a paper has not been digitised (or R2 is not configured).
  const corrige = params.get("c") === "1";
  const cle = params.get("o") === "1" ? cles.originale(numero, corrige) : cles.reconstituee(numero, corrige);
  const numerise = await lire(cle).catch(() => null);
  let octets: Uint8Array;
  if (numerise) {
    octets = numerise;
  } else {
    const original = await fetch(source);
    if (!original.ok) return NextResponse.redirect(source);
    octets = new Uint8Array(await original.arrayBuffer());
    // A photo published as is: no PDF to mark.
    if (!(original.headers.get("content-type") ?? "").includes("pdf")) return NextResponse.redirect(source);
  }
  if (octets.byteLength > LIMITE) return NextResponse.redirect(source);

  let marque: Uint8Array;
  try {
    const pdf = await PDFDocument.load(octets, { ignoreEncryption: true });
    const police = await pdf.embedFont(StandardFonts.Helvetica);
    for (const page of pdf.getPages()) {
      page.drawText(code, { x: 2, y: 2, size: 2, font: police, color: rgb(1, 1, 1), opacity: 0 });
    }
    pdf.setProducer("Campusly");
    pdf.setCreator("Campusly · campusly-ucac.vercel.app");
    pdf.setKeywords([code]);
    marque = await pdf.save();
  } catch {
    return NextResponse.redirect(source);
  }

  const fichier = decodeURIComponent(nom).replace(/[^\w.-]/g, "_");
  return new NextResponse(Buffer.from(marque), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename="${fichier}"`,
      "Cache-Control": apercu ? "public, max-age=3600, s-maxage=604800" : "private, no-store",
    },
  });
}
