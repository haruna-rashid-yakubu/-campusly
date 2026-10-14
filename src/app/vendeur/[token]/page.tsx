import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendeurs } from "@/db/schema";
import { LigneCommandeVendeur } from "@/components/commander/LigneCommandeVendeur";
import { calendrierDe, prochaineLivraison } from "@/lib/livraison";
import { libelleRecompense, regleDe, regleHebdoDe } from "@/lib/fidelite";
import { getCommandesRecentes, resumerDetail } from "@/lib/vendeurs";
import { lireMenu } from "@/lib/menu";
import { fcfa } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  return {
    title: "Mes commandes",
    robots: { index: false, follow: false },
    // Installs as "Mes commandes", opening on this page rather than on Campusly's home.
    manifest: `/vendeur/${token}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "default", title: "Mes commandes" },
  };
}

type Detail = { formule: string; parfums: Record<string, number> }[];

/*
 * The vendor's page, reached by a link only they have. Orders are grouped by
 * the Friday they are for, the coming one first, so on delivery day the list
 * is the round to make. The ones still to answer come before the ones done.
 *
 * Only what the vendor already has in WhatsApp is shown — reference, packs,
 * total, gift. No name or promo: they talk to the student there.
 */
export default async function EspaceVendeurPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [vendeur] = await db.select().from(vendeurs).where(eq(vendeurs.tokenEspace, token)).limit(1);
  if (!vendeur) notFound();

  const commandes = await getCommandesRecentes(vendeur.id, 21);
  const regle = regleDe(vendeur);
  const menu = lireMenu(vendeur.menu);
  const libelleMode = (id: string | null) => menu?.modes.find((m) => m.id === id)?.libelle ?? null;

  const calendrier = calendrierDe(vendeur);
  const groupes = new Map<string, { label: string; tri: number; lignes: typeof commandes }>();
  for (const c of commandes) {
    const l = calendrier ? prochaineLivraison(calendrier, c.createdAt) : null;
    const cle = l ? l.label : "Commandes";
    const g = groupes.get(cle) ?? { label: l ? `Livraison du ${l.label}` : "Commandes", tri: l?.date.getTime() ?? 0, lignes: [] };
    g.lignes.push(c);
    groupes.set(cle, g);
  }
  const ordreStatut = (s: string | null) => (s === null || s === "prete" ? 0 : s === "livree" ? 1 : 2);
  const liste = [...groupes.values()].sort((a, b) => b.tri - a.tri);

  const aTraiter = commandes.filter((c) => c.statut === null || c.statut === "prete").length;

  return (
    <div className="min-h-dvh bg-white pb-12">
      <div className="px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="text-[13px] font-bold uppercase tracking-wide text-teal-dark">Espace vendeur · Campusly</div>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight">{vendeur.nom}</h1>
        <p className="mt-1.5 text-[13.5px] leading-snug text-slate">
          Les commandes passées par Campusly arrivent ici, avec leur référence{" "}
          <b>{vendeur.categorie === "interne" ? "P-…" : "C-…"}</b>. Après la livraison, touche{" "}
          <b>Livrée</b>
          {vendeur.fidelite ? <> : c&rsquo;est ce qui remplit la carte fidélité de l&rsquo;étudiant</> : null}.
          Une commande jamais reçue sur WhatsApp : <b>Pas reçue</b>.
        </p>
        <div className="mt-3 rounded-[14px] bg-surface-2 px-3.5 py-2.5 text-[12.5px] leading-snug text-slate">
          Garde ce lien pour toi : ajoute cette page à ton écran d&rsquo;accueil pour la retrouver en un tap.
        </div>
        {aTraiter > 0 && (
          <div className="mt-3 text-[14px] font-extrabold">
            {aTraiter} commande{aTraiter > 1 ? "s" : ""} à traiter
          </div>
        )}
      </div>

      <div className="px-5">
        {liste.length === 0 && (
          <p className="mt-6 text-[14px] text-slate-light">Aucune commande sur les trois dernières semaines.</p>
        )}
        {liste.map((g) => (
          <section key={g.label} className="mt-6">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-[16.5px] font-extrabold tracking-tight first-letter:uppercase">{g.label}</span>
              <span className="text-[12.5px] text-slate-light">
                {g.lignes.length} commande{g.lignes.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[...g.lignes]
                .sort((a, b) => ordreStatut(a.statut) - ordreStatut(b.statut))
                .map((c) => (
                  <LigneCommandeVendeur
                    key={c.id}
                    token={token}
                    id={c.id}
                    reference={c.reference ?? ""}
                    quand={c.createdAt.toLocaleString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Douala",
                    })}
                    detail={resumerDetail((c.detail as Detail | null) ?? []) || "Demande de ramassage"}
                    total={c.total ? `Total ${fcfa(c.total)}` : ""}
                    cadeau={c.recompense === "hebdo" ? (regleHebdoDe(vendeur)?.libelle ?? "Cadeau fidélité") : c.recompense ? libelleRecompense(regle, c.recompense) : null}
                    statut={(c.statut as "prete" | "livree" | "non_recue" | null) ?? null}
                    mode={libelleMode(c.mode)}
                    avecPrete={menu !== null}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
