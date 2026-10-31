import { NextResponse } from "next/server";
import { lireEnvoi, urlEnvoi } from "@/lib/envois";

/*
 * A file someone sent (lib/envois), from R2. Its key carries a random part
 * and is never reused, so it can be cached for good.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ cle: string[] }> }) {
  const { cle } = await ctx.params;
  const fichier = await lireEnvoi(urlEnvoi(cle.map(decodeURIComponent).join("/"))).catch(() => null);
  if (!fichier) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(fichier.octets), {
    headers: {
      "Content-Type": fichier.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
