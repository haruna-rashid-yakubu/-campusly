"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { noterEvenementVendeur, preparerCommande } from "@/lib/actions";
import { fcfa } from "@/lib/utils";
import { memoriserCommande, usePanierSauve } from "@/lib/panier-client";

const compterPacks = (lignes: { parfums: Record<number, number> }[]) => lignes.length;

type Formule = {
  id: number;
  nom: string;
  taille: number;
  prix: number;
  prixBarre: number | null;
  badge: string | null;
};
type Article = {
  id: number;
  nom: string;
  description: string | null;
  photoUrl: string | null;
  enRupture: boolean;
};
type Ligne = { formuleId: number; parfums: Record<number, number> };

/*
 * Three steps on one screen, in the order a student thinks them: how many,
 * which ones, then send. The pack is picked first because its size is what
 * the flavour counters fill up to; a pack is added to the basket only once
 * it is exactly full, so the message the vendor receives never needs a
 * "and the other two?" reply.
 *
 * The order is finished on WhatsApp. The server writes the message from the
 * catalogue it holds, so what the vendor reads is the real price whatever
 * this screen showed.
 */
export function Catalogue({
  vendeurId,
  vendeurNom,
  livraison,
  fraisLivraison,
  cadeau = null,
  sansCompte = false,
  formules,
  articles,
  unite = "donut",
}: {
  vendeurId: number;
  vendeurNom: string;
  livraison: string | null;
  fraisLivraison: number;
  // The loyalty gift this order will carry, if any.
  cadeau?: string | null;
  // The shop has a loyalty card but the student is not signed in.
  sansCompte?: boolean;
  formules: Formule[];
  articles: Article[];
  // What one item of a pack is called, singular: "donut", "bouteille".
  unite?: string;
}) {
  const unites = (n: number) => `${unite}${n > 1 ? "s" : ""}`;
  const [formuleId, setFormuleId] = useState<number | null>(null);
  const [compo, setCompo] = useState<Record<number, number>>({});
  // Kept on the phone per shop: dropping out to check something no longer empties it.
  const [panier, setPanier] = usePanierSauve<Ligne[]>(
    vendeurId,
    [],
    (lignes) =>
      lignes.filter(
        (l) =>
          formules.some((f) => f.id === l.formuleId) &&
          Object.entries(l.parfums).every(([id, q]) => q === 0 || articles.some((a) => a.id === Number(id) && !a.enRupture))
      ),
    compterPacks
  );
  const [precision, setPrecision] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const ajoutNote = useRef(false);
  const panierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void noterEvenementVendeur(vendeurId, "vue");
  }, [vendeurId]);

  const formule = formules.find((f) => f.id === formuleId) ?? null;
  const compte = Object.values(compo).reduce((a, b) => a + b, 0);
  const plein = formule !== null && compte === formule.taille;
  const sousTotal = useMemo(
    () => panier.reduce((s, l) => s + (formules.find((f) => f.id === l.formuleId)?.prix ?? 0), 0),
    [panier, formules]
  );
  // Once per order, however many packs: the same trip across campus.
  const total = panier.length > 0 ? sousTotal + fraisLivraison : 0;

  const choisirFormule = (id: number) => {
    setFormuleId(id);
    const f = formules.find((x) => x.id === id);
    // Keep what was already picked if it still fits the new size.
    if (f && compte > f.taille) setCompo({});
  };

  const changer = (articleId: number, delta: number) => {
    if (!formule) {
      show("Choisis d'abord ton pack", "warn");
      return;
    }
    setCompo((prev) => {
      const actuel = prev[articleId] ?? 0;
      const suivant = Math.max(0, actuel + delta);
      if (delta > 0 && compte >= formule.taille) return prev;
      return { ...prev, [articleId]: suivant };
    });
  };

  const ajouter = () => {
    if (!formule || !plein) return;
    setPanier((p) => [...p, { formuleId: formule.id, parfums: compo }]);
    setCompo({});
    setFormuleId(null);
    show(`${formule.nom} ajouté au panier`);
    if (!ajoutNote.current) {
      ajoutNote.current = true;
      void noterEvenementVendeur(vendeurId, "ajout");
    }
    requestAnimationFrame(() => panierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const commander = () =>
    startTransition(async () => {
      const r = await preparerCommande({ vendeurId, panier, precision });
      if (!r.ok) {
        show(r.message, "warn");
        return;
      }
      memoriserCommande({
        vendeurId,
        vendeurNom,
        reference: r.reference,
        url: r.url,
        total,
        lignes: panier.map((l) => {
          const f = formules.find((x) => x.id === l.formuleId);
          const contenu = Object.entries(l.parfums)
            .filter(([, q]) => q > 0)
            .map(([id, q]) => `${q} ${nomArticle(Number(id))}`)
            .join(", ");
          return `${f?.nom ?? "Pack"} : ${contenu}`;
        }),
      });
      setPanier([]);
      window.location.href = r.url;
    });

  const nomArticle = (id: number) => articles.find((a) => a.id === id)?.nom ?? "?";

  return (
    <div>
      {/* 1. Le pack */}
      <Etape numero={1} titre="Choisis ton pack" />
      <div className="grid grid-cols-3 gap-2">
        {formules.map((f) => {
          const actif = f.id === formuleId;
          return (
            <button
              key={f.id}
              onClick={() => choisirFormule(f.id)}
              aria-pressed={actif}
              className={`press-scale relative flex flex-col items-center rounded-[18px] border-[1.5px] px-2 pb-3 pt-3.5 text-center ${
                actif ? "border-teal bg-teal-tint-soft" : "border-line-4 bg-white"
              }`}
            >
              {f.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e5528a] px-2 py-0.5 text-[10.5px] font-extrabold text-white">
                  {f.badge}
                </span>
              )}
              <span className="text-[26px] font-extrabold leading-none tabular-nums">{f.taille}</span>
              <span className="mt-0.5 text-[12px] font-bold text-slate-light">{unites(f.taille)}</span>
              {f.prixBarre && (
                <span className="mt-1.5 text-[11.5px] font-semibold text-slate-light line-through tabular-nums">
                  {fcfa(f.prixBarre)}
                </span>
              )}
              <span
                className={`${f.prixBarre ? "" : "mt-2 "}text-[13.5px] font-extrabold tabular-nums ${
                  f.prixBarre ? "text-[#c2185b]" : ""
                }`}
              >
                {fcfa(f.prix)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Les parfums */}
      <Etape
        numero={2}
        titre="Compose-le"
        droite={
          formule ? (
            <span className={`text-[13px] font-extrabold tabular-nums ${plein ? "text-teal-dark" : "text-slate-light"}`}>
              {compte} / {formule.taille} {unites(formule.taille)}
            </span>
          ) : null
        }
      />
      <div className="flex flex-col gap-2.5">
        {articles.map((a) => {
          const q = compo[a.id] ?? 0;
          const peutAjouter = formule !== null && compte < formule.taille && !a.enRupture;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-[18px] border border-line bg-white p-2.5 ${
                a.enRupture ? "opacity-55" : ""
              }`}
            >
              <div className="relative h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-surface">
                {a.photoUrl && (
                  <Image src={a.photoUrl} alt={a.nom} fill sizes="76px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold leading-tight">{a.nom}</div>
                {a.enRupture ? (
                  <div className="mt-0.5 text-[12.5px] font-bold text-warn-ink">Bientôt de retour</div>
                ) : (
                  a.description && (
                    <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-slate-light">
                      {a.description}
                    </div>
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
                  <span key={q} className="anim-pop w-5 text-center text-[16px] font-extrabold tabular-nums">{q}</span>
                  <button
                    onClick={() => changer(a.id, 1)}
                    disabled={formule !== null && !peutAjouter}
                    aria-label={`Un ${a.nom} de plus`}
                    className="press-scale grid h-9 w-9 place-items-center rounded-full bg-teal text-white disabled:opacity-35"
                  >
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {formule && (
        <button
          onClick={ajouter}
          disabled={!plein}
          className="press-scale mt-3.5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-bold text-white disabled:opacity-40"
        >
          <Icon name="plus" size={18} strokeWidth={2.2} />
          {plein
            ? `Ajouter le ${formule.nom.toLowerCase()} au panier`
            : `Encore ${formule.taille - compte} ${unites(formule.taille - compte)} à choisir`}
        </button>
      )}

      {/* 3. Le panier */}
      <div ref={panierRef} className="scroll-mt-24">
        <Etape numero={3} titre="Ton panier" />
        {panier.length === 0 ? (
          <p className="rounded-[18px] bg-surface-3 px-4 py-3.5 text-[13.5px] text-slate-light">
            Ton panier est vide. Choisis un pack, compose-le, puis ajoute-le ici. Tu peux en ajouter plusieurs.
          </p>
        ) : (
          <div className="rounded-[18px] border border-line">
            {panier.map((l, i) => {
              const f = formules.find((x) => x.id === l.formuleId);
              return (
                <div key={i} className="flex items-start gap-3 border-b border-line-3 px-3.5 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-extrabold">
                      {f?.nom} · {fcfa(f?.prix ?? 0)}
                    </div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-slate-light">
                      {Object.entries(l.parfums)
                        .filter(([, q]) => q > 0)
                        .map(([id, q]) => `${q} ${nomArticle(Number(id))}`)
                        .join(", ")}
                    </div>
                  </div>
                  <button
                    onClick={() => setPanier((p) => p.filter((_, j) => j !== i))}
                    aria-label="Retirer ce pack"
                    className="grid h-9 w-9 flex-none place-items-center rounded-full text-slate-light active:bg-surface-2"
                  >
                    <Icon name="x" size={17} />
                  </button>
                </div>
              );
            })}
            {fraisLivraison > 0 && (
              <div className="border-t border-line-3 px-3.5 py-2.5 text-[13.5px]">
                <div className="flex justify-between text-slate">
                  <span>Sous-total</span>
                  <span className="tabular-nums">{fcfa(sousTotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-slate">
                  <span>{livraison ?? "Livraison"}</span>
                  <span className="tabular-nums">{fcfa(fraisLivraison)}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-[15px] font-extrabold">
                  <span>Total</span>
                  <span className="tabular-nums">{fcfa(total)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {panier.length > 0 && cadeau && (
          <div className="mt-2.5 rounded-[14px] bg-[#fde7ef] px-3.5 py-2.5 text-[13.5px] font-extrabold text-[#c2185b]">
            <Icon name="gift" size={15} strokeWidth={2} className="mr-1.5 inline-block align-[-2px]" />Carte fidélité : {cadeau} avec cette commande
          </div>
        )}
        {panier.length > 0 && sansCompte && (
          <div className="mt-2.5 rounded-[14px] bg-surface-2 px-3.5 py-2.5 text-[12.5px] leading-snug text-slate">
            Tu n&rsquo;es pas connecté : cette commande ne comptera pas sur ta carte fidélité.
          </div>
        )}

        {panier.length > 0 && (
          <>
            <div className="mb-1.5 mt-4 text-[13px] font-bold text-ink-soft">
              Une précision pour {vendeurNom} ? <span className="font-medium text-slate-light">— facultatif</span>
            </div>
            <input
              value={precision}
              onChange={(e) => setPrecision(e.target.value)}
              maxLength={200}
              placeholder="Ex. : une question sur ta commande"
              className="h-[48px] w-full rounded-[14px] border-[1.5px] border-line-4 px-3.5 text-[14.5px] outline-none focus:border-teal"
            />
            <p className="mt-3 text-[12.5px] leading-snug text-slate-light">
              WhatsApp s&rsquo;ouvre avec ta commande déjà écrite. Tu l&rsquo;envoies, et {vendeurNom} te
              dit sur WhatsApp où récupérer ta commande à la pause de midi.
            </p>
          </>
        )}
      </div>

      {/* The button stays in reach while the flavours are scrolled. */}
      {panier.length > 0 && (
        <div
          className="anim-up fixed inset-x-0 z-20 mx-auto max-w-[480px] px-5"
          style={{ bottom: "calc(76px + var(--safe-bottom) + 10px)" }}
        >
          <button
            onClick={commander}
            disabled={pending}
            className="press-scale flex h-[56px] w-full items-center justify-between rounded-2xl bg-[#1fa855] px-4 text-white shadow-[0_8px_24px_rgba(15,23,42,.18)] disabled:opacity-70"
          >
            <span className="whitespace-nowrap text-[13.5px] font-bold tabular-nums">
              {panier.length} pack{panier.length > 1 ? "s" : ""} · {fcfa(total).replace(" FCFA", " F")}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[15.5px] font-extrabold">
              {pending ? "Ouverture…" : "Commander"}
              <Icon name="right" size={17} strokeWidth={2.4} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function Etape({ numero, titre, droite }: { numero: number; titre: string; droite?: React.ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between">
      <span className="flex items-center gap-2 text-[16.5px] font-extrabold tracking-tight">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[12px] text-white">{numero}</span>
        {titre}
      </span>
      {droite}
    </div>
  );
}
