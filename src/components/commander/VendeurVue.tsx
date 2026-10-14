import Image from "next/image";
import { BackHeader } from "@/components/BackHeader";
import { Catalogue } from "@/components/commander/Catalogue";
import { VideoVendeur } from "@/components/commander/VideoVendeur";
import { Icon } from "@/components/icons";
import type { Article, Formule, Vendeur } from "@/lib/vendeurs";
import { fcfa } from "@/lib/utils";
import { calendrierDe, prochaineLivraison } from "@/lib/livraison";
import type { Carte, Regle } from "@/lib/fidelite";
import { CarteFidelite } from "@/components/commander/CarteFidelite";
import { CatalogueUnite } from "@/components/commander/CatalogueUnite";
import { CatalogueMenu } from "@/components/commander/CatalogueMenu";
import { CarteHebdo } from "@/components/commander/CarteHebdo";
import { EnteteResto } from "@/components/commander/EnteteResto";
import { variablesTheme, type Menu } from "@/lib/menu";
import type { ProgresHebdo, RegleHebdo } from "@/lib/fidelite";
import { venteALUnite } from "@/lib/catalogue";

export function VendeurVue({
  vendeur,
  formules,
  articles,
  fidelite = null,
  menu = null,
  hebdo = null,
}: {
  vendeur: Pick<
    Vendeur,
    "id" | "nom" | "unite" | "accroche" | "logoUrl" | "logoFond" | "banniere" | "livraisonJour" | "limiteJour" | "limiteHeure" | "livraison" | "fraisLivraison" | "horaires" | "actif" | "videoUrl" | "videoPosterUrl"
  >;
  formules: Formule[];
  articles: Article[];
  // null when the shop has no loyalty card; carte null when signed out.
  fidelite?: { carte: Carte | null; regle: Regle } | null;
  // A restaurant's menu, when the shop has one: it replaces packs and units.
  menu?: Menu | null;
  // A weekly loyalty card (dishes since Monday); progres null when signed out.
  hebdo?: { regle: RegleHebdo; progres: ProgresHebdo | null } | null;
}) {
  // Worked out on every request, so the date moves on by itself each week.
  const calendrier = calendrierDe(vendeur);
  const livraison = calendrier ? prochaineLivraison(calendrier) : null;

  // The box behind the logo takes the logo's own background, so the logo
  // reads as one piece with it; the tagline turns dark on a light one.
  const fondLogo = vendeur.logoFond ?? "#000000";
  const fondClair = estClair(fondLogo);

  return (
    <div className="min-h-dvh pb-[calc(170px+var(--safe-bottom))]" style={variablesTheme(menu?.theme)}>
      <BackHeader title={vendeur.nom} fallbackHref="/commander" />

      <div className="px-5">
        {!vendeur.actif && (
          <div className="mb-3 rounded-[14px] bg-warn-tint px-3.5 py-2.5 text-[13px] font-bold text-warn-ink">
            Aperçu équipe : les étudiants ne voient pas encore cette page.
          </div>
        )}

        {menu?.theme ? (
          <EnteteResto
            nom={vendeur.nom}
            accroche={vendeur.accroche}
            theme={menu.theme}
            fond={vendeur.banniere}
            icone={menu.sections[0]?.icone}
          />
        ) : (
        /* The box the donuts come in: pink and white stripes. */
        <div
          className="overflow-hidden rounded-[22px] p-5"
          style={{
            // Each shop can have its own; the pink stripes were Bronuts' first.
            background: vendeur.banniere ?? "repeating-linear-gradient(135deg, #f7b6c9 0 18px, #fff4f7 18px 36px)",
          }}
        >
          {vendeur.logoUrl ? (
            <div
              className="mx-auto max-w-[300px] overflow-hidden rounded-[18px] px-5 pb-4 pt-3 text-center shadow-[0_6px_18px_rgba(15,23,42,.25)]"
              style={{ background: fondLogo }}
            >
              <Image
                src={vendeur.logoUrl}
                alt={vendeur.nom}
                width={654}
                height={313}
                priority
                className="mx-auto h-auto w-[210px]"
              />
              {vendeur.accroche && (
                <div
                  className={`mt-1 text-[13px] font-semibold leading-snug ${fondClair ? "text-ink-soft" : "text-white/85"}`}
                >
                  {vendeur.accroche}
                </div>
              )}
            </div>
          ) : (
            <div className="inline-block rounded-[16px] bg-white/90 px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,.14)]">
              <div className="text-[26px] font-extrabold leading-none tracking-tight text-[var(--v-fonce,#c2185b)]">
                {vendeur.nom}
              </div>
              {vendeur.accroche && (
                <div className="mt-1.5 max-w-[240px] text-[13px] font-semibold leading-snug text-ink-soft">
                  {vendeur.accroche}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Muted, so it can play without sound in a lecture hall. */}
        {vendeur.videoUrl && (
          <VideoVendeur src={vendeur.videoUrl} poster={vendeur.videoPosterUrl ?? undefined} />
        )}

        {livraison && (
          <div
            className={`mt-3 rounded-[16px] px-4 py-3 ${
              livraison.cetteSemaine ? "bg-teal-tint-soft text-teal-active" : "bg-warn-tint text-warn-ink"
            }`}
          >
            <div className="text-[14.5px] font-extrabold">
              🚚 {livraison.cetteSemaine ? "Livré" : "Livraison"} le {livraison.label}
            </div>
            <div className="mt-0.5 text-[12.5px] leading-snug">
              {livraison.cetteSemaine
                ? livraison.heuresRestantes !== null
                  ? `Plus que ${livraison.heuresRestantes} h pour commander : c'est jusqu'à ${livraison.limiteLabel}.`
                  : `Commande avant ${livraison.limiteLabel} pour cette livraison.`
                : `Les commandes pour ce vendredi sont closes depuis ${livraison.limiteLabel}. Ta commande part pour la semaine prochaine.`}
            </div>
          </div>
        )}

        {(vendeur.livraison || vendeur.horaires) && (
          <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-slate">
            {vendeur.horaires && (
              <div className="flex items-center gap-2">
                <Icon name="cal" size={16} className="text-[var(--v-accent,#0a7f77)]" />
                {vendeur.horaires}
              </div>
            )}
            {vendeur.livraison && (
              <div className="flex items-center gap-2">
                <Icon name="pin" size={16} className="text-[var(--v-accent,#0a7f77)]" />
                {vendeur.livraison}
                {vendeur.fraisLivraison > 0 && ` · ${fcfa(vendeur.fraisLivraison)}`}
              </div>
            )}
          </div>
        )}

        {hebdo ? (
          <CarteHebdo regle={hebdo.regle} progres={hebdo.progres} vendeurNom={vendeur.nom} />
        ) : (
          fidelite && <CarteFidelite carte={fidelite.carte} regle={fidelite.regle} vendeurNom={vendeur.nom} />
        )}

        {menu ? (
          <CatalogueMenu
            vendeurId={vendeur.id}
            vendeurNom={vendeur.nom}
            menu={menu}
            cadeau={hebdo?.progres?.cadeauPret ? hebdo.regle.libelle : null}
          />
        ) : venteALUnite(formules) ? (
          <CatalogueUnite
            vendeurId={vendeur.id}
            vendeurNom={vendeur.nom}
            formuleId={formules[0].id}
            prix={formules[0].prix}
            unite={vendeur.unite ?? "article"}
            fraisLivraison={vendeur.fraisLivraison}
            cadeau={fidelite?.carte?.prochaine?.libelle ?? null}
            sansCompte={fidelite !== null && fidelite.carte === null}
            articles={articles.map((a) => ({
              id: a.id,
              nom: a.nom,
              description: a.description,
              photoUrl: a.photoUrl,
              enRupture: a.enRupture,
            }))}
          />
        ) : (
          <Catalogue
            vendeurId={vendeur.id}
            vendeurNom={vendeur.nom}
            unite={vendeur.unite ?? undefined}
            livraison={vendeur.livraison}
            fraisLivraison={vendeur.fraisLivraison}
            cadeau={fidelite?.carte?.prochaine?.libelle ?? null}
            sansCompte={fidelite !== null && fidelite.carte === null}
            formules={formules.map((f) => ({
              id: f.id,
              nom: f.nom,
              taille: f.taille,
              prix: f.prix,
              prixBarre: f.prixBarre,
              badge: f.badge,
            }))}
            articles={articles.map((a) => ({
              id: a.id,
              nom: a.nom,
              description: a.description,
              photoUrl: a.photoUrl,
              enRupture: a.enRupture,
            }))}
          />
        )}
      </div>
    </div>
  );
}

/** Whether a #rrggbb colour is light enough to need dark text on it. */
function estClair(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
