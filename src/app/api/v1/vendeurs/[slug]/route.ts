import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { noterEvenementVendeur } from "@/lib/actions";
import { introuvable, vendeurPublic } from "@/lib/api";
import { calendrierDe, prochaineLivraison } from "@/lib/livraison";
import { getCarte, progresHebdo, regleDe, regleHebdoDe } from "@/lib/fidelite";
import { epuisesDuJour, lireMenu } from "@/lib/menu";
import { getCatalogue, getVendeurParSlug } from "@/lib/vendeurs";

export const dynamic = "force-dynamic";

// A shop's page, with the loyalty card of whoever is signed in. Mirrors /commander/[slug].
export async function GET(_: Request, ctx: RouteContext<"/api/v1/vendeurs/[slug]">) {
  const [vendeur, session] = await Promise.all([getVendeurParSlug((await ctx.params).slug), auth()]);
  if (!vendeur || !vendeur.actif) return introuvable();
  const userId = session?.user?.id;

  const regleHebdo = vendeur.fidelite ? regleHebdoDe(vendeur) : null;
  const [{ formules, articles }, carte, progres] = await Promise.all([
    getCatalogue(vendeur.id),
    vendeur.fidelite && !regleHebdo && userId ? getCarte(userId, vendeur.id, regleDe(vendeur)) : null,
    regleHebdo && userId ? progresHebdo(userId, vendeur.id, regleHebdo) : null,
    noterEvenementVendeur(vendeur.id, "vue"),
  ]);

  return NextResponse.json({
    vendeur: vendeurPublic(vendeur),
    formules,
    articles,
    menu: lireMenu(vendeur.menu),
    epuises: epuisesDuJour(vendeur.epuises),
    fidelite: vendeur.fidelite && !regleHebdo ? { carte, regle: regleDe(vendeur) } : null,
    hebdo: regleHebdo ? { regle: regleHebdo, progres } : null,
    // For shops that deliver on a fixed day: when, and until when to order.
    livraison: (() => {
      const calendrier = calendrierDe(vendeur);
      return calendrier ? prochaineLivraison(calendrier) : null;
    })(),
  });
}
