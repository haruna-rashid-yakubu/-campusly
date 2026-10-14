"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { noterEvenementVendeur, preparerCommande } from "@/lib/actions";
import { MAX_UNITES } from "@/lib/catalogue";
import { fcfa } from "@/lib/utils";

type Article = {
  id: number;
  nom: string;
  description: string | null;
  photoUrl: string | null;
  enRupture: boolean;
};

/*
 * The catalogue of a shop that sells by the unit: no pack to pick, a counter
 * on each flavour, and the basket is simply what the counters say. The
 * order goes as one line — "3 Fraise, 2 Menthe" — at the unit price, which
 * the server re-reads.
 */
export function CatalogueUnite({
  vendeurId,
  vendeurNom,
  formuleId,
  prix,
  unite,
  fraisLivraison,
  cadeau = null,
  sansCompte = false,
  articles,
}: {
  vendeurId: number;
  vendeurNom: string;
  formuleId: number;
  prix: number;
  unite: string;
  fraisLivraison: number;
  cadeau?: string | null;
  sansCompte?: boolean;
  articles: Article[];
}) {
  const unites = (n: number) => `${unite}${n > 1 ? "s" : ""}`;
  const [quantites, setQuantites] = useState<Record<number, number>>({});
  const [precision, setPrecision] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const ajoutNote = useRef(false);

  useEffect(() => {
    void noterEvenementVendeur(vendeurId, "vue");
  }, [vendeurId]);

  const compte = Object.values(quantites).reduce((a, b) => a + b, 0);
  const sousTotal = compte * prix;
  const total = compte > 0 ? sousTotal + fraisLivraison : 0;

  const changer = (articleId: number, delta: number) => {
    if (delta > 0 && compte >= MAX_UNITES) {
      show(`${MAX_UNITES} ${unites(MAX_UNITES)} au maximum par commande`, "warn");
      return;
    }
    setQuantites((prev) => ({ ...prev, [articleId]: Math.max(0, (prev[articleId] ?? 0) + delta) }));
    if (delta > 0 && !ajoutNote.current) {
      ajoutNote.current = true;
      void noterEvenementVendeur(vendeurId, "ajout");
    }
  };

  const commander = () =>
    startTransition(async () => {
      const r = await preparerCommande({ vendeurId, panier: [{ formuleId, parfums: quantites }], precision });
      if (!r.ok) {
        show(r.message, "warn");
        return;
      }
      window.location.href = r.url;
    });

  return (
    <div>
      <div className="mb-2.5 mt-6 flex items-baseline justify-between">
        <span className="text-[16.5px] font-extrabold tracking-tight">Choisis tes {unites(2)}</span>
        <span className="text-[13px] font-bold text-slate-light">
          {fcfa(prix)} / {unite}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {articles.map((a) => {
          const q = quantites[a.id] ?? 0;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-[18px] border bg-white p-2.5 ${
                q > 0 ? "border-teal" : "border-line"
              } ${a.enRupture ? "opacity-55" : ""}`}
            >
              <div className="relative h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-surface">
                {a.photoUrl && <Image src={a.photoUrl} alt={a.nom} fill sizes="76px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold leading-tight">{a.nom}</div>
                {a.enRupture ? (
                  <div className="mt-0.5 text-[12.5px] font-bold text-warn-ink">Bientôt de retour</div>
                ) : (
                  a.description && (
                    <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-slate-light">{a.description}</div>
                  )
                )}
              </div>
              {!a.enRupture && (
                <div className="flex flex-none items-center gap-1.5">
                  <button
                    onClick={() => changer(a.id, -1)}
                    disabled={q === 0}
                    aria-label={`Un ${a.nom} de moins`}
                    className="press-scale grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-line-4 disabled:opacity-35"
                  >
                    <Icon name="minus" size={16} strokeWidth={2.4} />
                  </button>
                  <span className="w-6 text-center text-[16px] font-extrabold tabular-nums">{q}</span>
                  <button
                    onClick={() => changer(a.id, 1)}
                    aria-label={`Un ${a.nom} de plus`}
                    className="press-scale grid h-9 w-9 place-items-center rounded-full bg-teal text-white"
                  >
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {compte > 0 && (
        <>
          <div className="mt-4 rounded-[18px] border border-line px-3.5 py-3 text-[13.5px]">
            {articles
              .filter((a) => (quantites[a.id] ?? 0) > 0)
              .map((a) => (
                <div key={a.id} className="flex justify-between py-0.5">
                  <span>
                    {quantites[a.id]} × {a.nom}
                  </span>
                  <span className="tabular-nums text-slate">{fcfa((quantites[a.id] ?? 0) * prix)}</span>
                </div>
              ))}
            <div className="mt-1.5 flex justify-between border-t border-line-3 pt-1.5 text-slate">
              <span>Livraison</span>
              <span className="tabular-nums">{fraisLivraison > 0 ? fcfa(fraisLivraison) : "Offerte"}</span>
            </div>
            <div className="mt-1 flex justify-between text-[15px] font-extrabold">
              <span>Total</span>
              <span className="tabular-nums">{fcfa(total)}</span>
            </div>
          </div>

          {cadeau && (
            <div className="mt-2.5 rounded-[14px] bg-[#fde7ef] px-3.5 py-2.5 text-[13.5px] font-extrabold text-[#c2185b]">
              🎁 Carte fidélité : {cadeau} avec cette commande
            </div>
          )}
          {sansCompte && (
            <div className="mt-2.5 rounded-[14px] bg-surface-2 px-3.5 py-2.5 text-[12.5px] leading-snug text-slate">
              Tu n&rsquo;es pas connecté : cette commande ne comptera pas sur ta carte fidélité.
            </div>
          )}

          <div className="mb-1.5 mt-4 text-[13px] font-bold text-ink-soft">
            Une précision pour {vendeurNom} ? <span className="font-medium text-slate-light">— facultatif</span>
          </div>
          <input
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
            maxLength={200}
            placeholder="Ex. : où te livrer, à quelle heure"
            className="h-[48px] w-full rounded-[14px] border-[1.5px] border-line-4 px-3.5 text-[14.5px] outline-none focus:border-teal"
          />
          <p className="mt-3 text-[12.5px] leading-snug text-slate-light">
            WhatsApp s&rsquo;ouvre avec ta commande déjà écrite. Tu l&rsquo;envoies, et {vendeurNom} te répond pour
            la livraison.
          </p>

          <div
            className="fixed inset-x-0 z-20 mx-auto max-w-[480px] px-5"
            style={{ bottom: "calc(76px + var(--safe-bottom) + 10px)" }}
          >
            <button
              onClick={commander}
              disabled={pending}
              className="press-scale flex h-[56px] w-full items-center justify-between rounded-2xl bg-[#1fa855] px-4 text-white shadow-[0_8px_24px_rgba(15,23,42,.18)] disabled:opacity-70"
            >
              <span className="whitespace-nowrap text-[13.5px] font-bold tabular-nums">
                {compte} {unites(compte)} · {fcfa(total).replace(" FCFA", " F")}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[15.5px] font-extrabold">
                {pending ? "Ouverture…" : "Commander"}
                <Icon name="right" size={17} strokeWidth={2.4} />
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
