import { BackHeader } from "@/components/BackHeader";
import { Catalogue } from "@/components/commander/Catalogue";
import { Icon } from "@/components/icons";
import type { Article, Formule, Vendeur } from "@/lib/vendeurs";
import { fcfa } from "@/lib/utils";

export function VendeurVue({
  vendeur,
  formules,
  articles,
}: {
  vendeur: Pick<
    Vendeur,
    "id" | "nom" | "accroche" | "livraison" | "fraisLivraison" | "horaires" | "actif" | "videoUrl" | "videoPosterUrl"
  >;
  formules: Formule[];
  articles: Article[];
}) {
  return (
    <div className="min-h-dvh pb-[calc(170px+var(--safe-bottom))]">
      <BackHeader title={vendeur.nom} fallbackHref="/commander" />

      <div className="px-5">
        {!vendeur.actif && (
          <div className="mb-3 rounded-[14px] bg-warn-tint px-3.5 py-2.5 text-[13px] font-bold text-warn-ink">
            Aperçu équipe : les étudiants ne voient pas encore cette page.
          </div>
        )}

        {/* The box the donuts come in: pink and white stripes. */}
        <div
          className="overflow-hidden rounded-[22px] p-5"
          style={{
            background:
              "repeating-linear-gradient(135deg, #f7b6c9 0 18px, #fff4f7 18px 36px)",
          }}
        >
          <div className="inline-block rounded-[16px] bg-white/90 px-4 py-3 shadow-[0_4px_14px_rgba(229,82,138,.18)]">
            <div className="text-[26px] font-extrabold leading-none tracking-tight text-[#c2185b]">
              {vendeur.nom} 🍩
            </div>
            {vendeur.accroche && (
              <div className="mt-1.5 max-w-[240px] text-[13px] font-semibold leading-snug text-ink-soft">
                {vendeur.accroche}
              </div>
            )}
          </div>
        </div>

        {/* Muted and looping, so it plays by itself without asking for sound
            in a lecture hall; playsInline keeps iPhones from going fullscreen. */}
        {vendeur.videoUrl && (
          <video
            src={vendeur.videoUrl}
            poster={vendeur.videoPosterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="mt-3 aspect-[4/3] w-full rounded-[20px] bg-surface object-cover"
          />
        )}

        {(vendeur.livraison || vendeur.horaires) && (
          <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-slate">
            {vendeur.horaires && (
              <div className="flex items-center gap-2">
                <Icon name="cal" size={16} className="text-teal-dark" />
                {vendeur.horaires}
              </div>
            )}
            {vendeur.livraison && (
              <div className="flex items-center gap-2">
                <Icon name="pin" size={16} className="text-teal-dark" />
                {vendeur.livraison}
                {vendeur.fraisLivraison > 0 && ` · ${fcfa(vendeur.fraisLivraison)}`}
              </div>
            )}
          </div>
        )}

        <Catalogue
          vendeurId={vendeur.id}
          vendeurNom={vendeur.nom}
          livraison={vendeur.livraison}
          fraisLivraison={vendeur.fraisLivraison}
          formules={formules.map((f) => ({ id: f.id, nom: f.nom, taille: f.taille, prix: f.prix, badge: f.badge }))}
          articles={articles.map((a) => ({
            id: a.id,
            nom: a.nom,
            description: a.description,
            photoUrl: a.photoUrl,
            enRupture: a.enRupture,
          }))}
        />
      </div>
    </div>
  );
}
