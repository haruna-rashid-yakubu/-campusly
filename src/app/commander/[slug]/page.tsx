import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { VendeurVue } from "@/components/commander/VendeurVue";
import { getCatalogue, getVendeurParSlug } from "@/lib/vendeurs";
import { getCarte, progresHebdo, regleDe, regleHebdoDe } from "@/lib/fidelite";
import { epuisesDuJour, lireMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vendeur = await getVendeurParSlug(slug);
  if (!vendeur) return { title: "Introuvable" };
  return {
    title: `${vendeur.nom} · Commander`,
    description: vendeur.accroche ?? undefined,
    alternates: { canonical: `/commander/${vendeur.slug}` },
  };
}

export default async function VendeurPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [vendeur, session] = await Promise.all([getVendeurParSlug(slug), auth()]);
  if (!vendeur) notFound();
  const admin = session?.user?.role === "admin";
  if (!vendeur.actif && !admin) notFound();

  const { formules, articles } = await getCatalogue(vendeur.id);
  const menu = lireMenu(vendeur.menu);
  const regleHebdo = vendeur.fidelite ? regleHebdoDe(vendeur) : null;
  const carte =
    vendeur.fidelite && !regleHebdo && session?.user?.id
      ? await getCarte(session.user.id, vendeur.id, regleDe(vendeur))
      : null;
  const progres = regleHebdo && session?.user?.id ? await progresHebdo(session.user.id, vendeur.id, regleHebdo) : null;

  return (
    <VendeurVue
      vendeur={vendeur}
      formules={formules}
      articles={articles}
      fidelite={vendeur.fidelite && !regleHebdo ? { carte, regle: regleDe(vendeur) } : null}
      menu={menu}
      hebdo={regleHebdo ? { regle: regleHebdo, progres } : null}
      epuises={epuisesDuJour(vendeur.epuises)}
    />
  );
}
