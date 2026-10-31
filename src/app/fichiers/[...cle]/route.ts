import { NextResponse } from "next/server";
import { lireEnvoi, urlEnvoi } from "@/lib/envois";

/*
 * A file someone sent (lib/envois), straight from R2. Its key carries a
 * random part and is never reused, so it can be cached for good.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ cle: string[] }> }) {
  const { cle } = await ctx.params;
  const objet = await lireEnvoi(urlEnvoi(cle.map(decodeURIComponent).join("/")));
  if (!objet) return new NextResponse(null, { status: 404 });
  return new NextResponse(objet.body as ReadableStream, {
    headers: {
      "Content-Type": objet.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(objet.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
