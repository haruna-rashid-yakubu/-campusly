import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendeurs } from "@/db/schema";

export const dynamic = "force-dynamic";

/*
 * The vendor's page installs as its own app. With the site's manifest, "Add
 * to home screen" on Android installs Campusly itself, and the icon opens the
 * students' home screen — the vendor then looks for their orders and stops
 * using the link. This one starts, and stays, on their own page; Campusly
 * remains a separate app they can install as well.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [vendeur] = await db
    .select({ nom: vendeurs.nom })
    .from(vendeurs)
    .where(eq(vendeurs.tokenEspace, token))
    .limit(1);
  if (!vendeur) return new NextResponse("Not found", { status: 404 });

  const chemin = `/vendeur/${token}`;
  return NextResponse.json(
    {
      id: chemin,
      name: `Mes commandes · ${vendeur.nom}`,
      short_name: "Mes commandes",
      description: `Les commandes Campusly de ${vendeur.nom}.`,
      start_url: chemin,
      scope: chemin,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#14B8AC",
      orientation: "portrait",
      lang: "fr",
      icons: [
        { src: "/icon-192", sizes: "192x192", type: "image/png" },
        { src: "/icon-512", sizes: "512x512", type: "image/png" },
        { src: "/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } }
  );
}
