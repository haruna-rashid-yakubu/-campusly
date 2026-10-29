import { NextResponse } from "next/server";
import { lecteur, ouvrir } from "@/lib/acces";
import { cles, lire } from "@/lib/numerisation/r2";

/*
 * A cleaned page photograph or a figure of a digitised Sujet, from the private
 * bucket. Names are only those the publication writes, so nothing else in the
 * bucket can be reached through here.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string; nom: string }> }) {
  const { id, nom } = await ctx.params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0 || !/^(corrige-)?(page|figure)-\d{2}\.jpg$/.test(nom)) {
    return new NextResponse(null, { status: 404 });
  }
  // The same door as the PDF: a signed-in account, within its daily limit.
  const acces = await ouvrir(await lecteur(new URL(request.url).searchParams.get("t")), numero);
  if (!acces.ok) return new NextResponse(null, { status: acces.raison === "quota" ? 429 : 401 });
  const image = await lire(cles.image(numero, nom)).catch(() => null);
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(image), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" },
  });
}
