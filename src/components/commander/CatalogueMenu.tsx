"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { noterEvenementVendeur, preparerCommandeMenu } from "@/lib/actions";
import {
  MAX_LIGNES,
  MAX_PAR_LIGNE,
  cleEpuise,
  itemEpuise,
  libelleLigne,
  type ItemMenu,
  type LigneMenu,
  type Menu,
} from "@/lib/menu";
import { enablePush, readPushStatus, type PushStatus } from "@/lib/push-client";
import { fcfa } from "@/lib/utils";
import { memoriserCommande, usePanierSauve } from "@/lib/panier-client";

const compterMenu = (s: { lignes: { quantite: number }[] }) => s.lignes.reduce((n, l) => n + l.quantite, 0);
import { IconeEmoji } from "@/components/TexteIcone";

const f = (n: number) => fcfa(n).replace(" FCFA", " F");

/*
 * A restaurant's menu: each item picked with its size and, where it asks for
 * one, its choice (the side, the flavour), then added to a basket that adds
 * everything up — the boxes the dishes leave in, and how the order is handed
 * over. The order is finished on WhatsApp, written by the server from the
 * menu it holds.
 *
 * The phone's push address goes with the order, so the restaurant's "ready"
 * reaches the student; a student without notifications is offered them here,
 * where the reason to want them is obvious.
 */
export function CatalogueMenu({
  vendeurId,
  vendeurNom,
  menu,
  cadeau = null,
  epuises = [],
}: {
  vendeurId: number;
  vendeurNom: string;
  menu: Menu;
  cadeau?: string | null;
  // Run out today, as the vendor set it from their link.
  epuises?: string[];
}) {
  const horsStock = useMemo(() => new Set(epuises), [epuises]);
  // The basket and the way the meal is handed over, kept on the phone per
  // shop, without what is no longer on the menu or has run out today.
  const [sauve, setSauve] = usePanierSauve<{ lignes: LigneMenu[]; mode: string }>(
    vendeurId,
    { lignes: [], mode: menu.modes[0].id },
    (s) => {
      const item = (id: string) => menu.sections.flatMap((x) => x.items).find((i) => i.id === id);
      return {
        mode: menu.modes.some((m) => m.id === s.mode) ? s.mode : menu.modes[0].id,
        lignes: s.lignes.filter((l) => {
          const it = item(l.item);
          return (
            !!it &&
            !itemEpuise(it, horsStock) &&
            it.tailles.some((t) => t.id === l.taille) &&
            (!l.choix || !horsStock.has(cleEpuise(it.id, l.choix)))
          );
        }),
      };
    },
    compterMenu
  );
  const panier = sauve.lignes;
  const mode = sauve.mode;
  const setPanier = (maj: (p: LigneMenu[]) => LigneMenu[]) => setSauve((s) => ({ ...s, lignes: maj(s.lignes) }));
  const setMode = (m: string) => setSauve((s) => ({ ...s, mode: m }));
  const [precision, setPrecision] = useState("");
  // Read on first render: the prompt only shows once something is in the
  // basket, which never happens on the server, so the two never disagree.
  const [push, setPush] = useState<PushStatus>(() =>
    typeof window === "undefined" ? "unsupported" : readPushStatus()
  );
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const ajoutNote = useRef(false);

  useEffect(() => {
    void noterEvenementVendeur(vendeurId, "vue");
  }, [vendeurId]);

  const items = useMemo(() => new Map(menu.sections.flatMap((s) => s.items.map((i) => [i.id, i] as const))), [menu]);
  const prixLigne = (l: LigneMenu) => (items.get(l.item)?.tailles.find((t) => t.id === l.taille)?.prix ?? 0) * l.quantite;
  const sousTotal = panier.reduce((s, l) => s + prixLigne(l), 0);
  const plats = panier.reduce((n, l) => n + (items.get(l.item)?.plat ? l.quantite : 0), 0);
  const modeChoisi = menu.modes.find((m) => m.id === mode) ?? menu.modes[0];
  const gamelles = modeChoisi.gamelle ? plats * menu.gamelle : 0;
  const total = panier.length > 0 ? sousTotal + gamelles + modeChoisi.prix : 0;
  const nbArticles = panier.reduce((n, l) => n + l.quantite, 0);
  const manqueAdresse = !!modeChoisi.adresse && !precision.trim();
  const champAdresse = useRef<HTMLInputElement>(null);

  const ajouter = ({ quantite: n, ...ligne }: LigneMenu) => {
    setPanier((p) => {
      const i = p.findIndex((l) => l.item === ligne.item && l.taille === ligne.taille && l.choix === ligne.choix);
      if (i >= 0) {
        return p.map((l, j) => (j === i ? { ...l, quantite: Math.min(MAX_PAR_LIGNE, l.quantite + n) } : l));
      }
      if (p.length >= MAX_LIGNES) return p;
      return [...p, { ...ligne, quantite: Math.min(MAX_PAR_LIGNE, n) }];
    });
    const item = items.get(ligne.item);
    const taille = item?.tailles.find((t) => t.id === ligne.taille);
    if (item && taille) show(`${n > 1 ? `${n} × ` : ""}${libelleLigne(item, taille, ligne.choix)} ajouté${n > 1 ? "s" : ""}`);
    if (!ajoutNote.current) {
      ajoutNote.current = true;
      void noterEvenementVendeur(vendeurId, "ajout");
    }
  };

  const changer = (i: number, delta: number) =>
    setPanier((p) =>
      p
        .map((l, j) => (j === i ? { ...l, quantite: Math.min(MAX_PAR_LIGNE, l.quantite + delta) } : l))
        .filter((l) => l.quantite > 0)
    );

  const activerNotifs = async () => {
    try {
      setPush(await enablePush());
    } catch {
      setPush(readPushStatus());
    }
  };

  const commander = () => {
    if (manqueAdresse) {
      show("Indique où te livrer : ta cité et ta chambre", "warn");
      champAdresse.current?.focus();
      return;
    }
    startTransition(async () => {
      let pushEndpoint: string | null = null;
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        pushEndpoint = (await reg?.pushManager.getSubscription())?.endpoint ?? null;
      } catch {
        // Without it the order still goes; only the "ready" signal is lost.
      }
      const r = await preparerCommandeMenu({ vendeurId, lignes: panier, mode, precision, pushEndpoint });
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
          const item = items.get(l.item);
          const taille = item?.tailles.find((t) => t.id === l.taille);
          return `${l.quantite} × ${item && taille ? libelleLigne(item, taille, l.choix) : l.item}`;
        }),
      });
      setPanier(() => []);
      window.location.href = r.url;
    });
  };

  return (
    <div>
      {/* The three ways to get the food, shown before anything is picked: it decides the price. */}
      {menu.modes.length > 1 && (
        <section className="mt-5">
          <div className="mb-2.5 text-[16.5px] font-extrabold tracking-tight">Comment tu veux ton repas ?</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${menu.modes.length}, minmax(0, 1fr))` }}>
            {menu.modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`press-scale flex flex-col items-center rounded-[16px] border-[1.5px] px-1.5 pb-2.5 pt-3 text-center ${
                  mode === m.id ? "border-[var(--v-accent,#14b8ac)] bg-[var(--v-doux,#f4fbfa)]" : "border-line-4 bg-white"
                }`}
              >
                {m.icone && <IconeEmoji emoji={m.icone} size={26} />}
                <span className="mt-1.5 text-[13.5px] font-extrabold leading-tight">{m.court ?? m.libelle}</span>
                <span className="mt-1 text-[11.5px] font-semibold leading-tight text-slate-light">
                  {m.prix > 0 ? `+ ${f(m.prix)}` : "Gratuit"}
                  {m.gamelle && menu.gamelle > 0 && (
                    <span className="block">+ {f(menu.gamelle)} de gamelle par plat</span>
                  )}
                </span>
              </button>
            ))}
          </div>
          {modeChoisi.detail && (
            <p className="mt-2 text-[12.5px] leading-snug text-slate">
              {modeChoisi.detail}
            </p>
          )}
        </section>
      )}

      {menu.sections.map((s) => (
        <section key={s.titre}>
          <div className="mb-2.5 mt-6 flex items-center gap-2 text-[16.5px] font-extrabold tracking-tight">
            {s.icone && (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--v-doux,#f4fbfa)] text-[var(--v-accent,#0a7f77)]"><IconeEmoji emoji={s.icone} size={17} /></span>
            )}
            {s.titre}
          </div>
          <div className="flex flex-col gap-2.5">
            {s.items.map((item) => (
              <CarteItem key={item.id} item={item} icone={s.icone} epuises={horsStock} onAjouter={ajouter} />
            ))}
          </div>
        </section>
      ))}

      {panier.length > 0 && (
        <>
          <div className="mb-2.5 mt-7 text-[16.5px] font-extrabold tracking-tight">Ta commande</div>
          <div className="rounded-[18px] border border-line">
            {panier.map((l, i) => {
              const item = items.get(l.item)!;
              const taille = item.tailles.find((t) => t.id === l.taille)!;
              return (
                <div key={`${l.item}-${l.taille}-${l.choix ?? ""}`} className="flex items-center gap-2.5 border-b border-line-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold leading-snug">{libelleLigne(item, taille, l.choix)}</div>
                    <div className="text-[12.5px] tabular-nums text-slate-light">{f(prixLigne(l))}</div>
                  </div>
                  <button
                    onClick={() => changer(i, -1)}
                    aria-label="Un de moins"
                    className="press-scale grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-line-4"
                  >
                    <Icon name="minus" size={15} strokeWidth={2.4} />
                  </button>
                  <span key={l.quantite} className="anim-pop w-5 text-center text-[15px] font-extrabold tabular-nums">{l.quantite}</span>
                  <button
                    onClick={() => changer(i, 1)}
                    aria-label="Un de plus"
                    className="press-scale grid h-8 w-8 place-items-center rounded-full bg-[var(--v-accent,#14b8ac)] text-white"
                  >
                    <Icon name="plus" size={15} strokeWidth={2.4} />
                  </button>
                </div>
              );
            })}

            <div className="px-3.5 py-3">
              <div className="text-[13px] font-bold text-ink-soft">Comment tu la récupères ?</div>
              <div className="mt-2 flex flex-col gap-2">
                {menu.modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center justify-between gap-2 rounded-[14px] border-[1.5px] px-3 py-2.5 text-left ${
                      mode === m.id ? "border-[var(--v-accent,#14b8ac)] bg-[var(--v-doux,#f4fbfa)]" : "border-line-4"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold">{m.libelle}</span>
                      {m.detail && <span className="block text-[12px] text-slate-light">{m.detail}</span>}
                    </span>
                    <span className="flex-none text-right text-[13px] font-extrabold tabular-nums">
                      {m.prix > 0 ? `+ ${f(m.prix)}` : "Gratuit"}
                      {m.gamelle && menu.gamelle > 0 && plats > 0 && (
                        <span className="block text-[11px] font-semibold text-slate-light">+ gamelle</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-line-3 px-3.5 py-2.5 text-[13.5px]">
              <div className="flex justify-between text-slate">
                <span>Sous-total</span>
                <span className="tabular-nums">{f(sousTotal)}</span>
              </div>
              {gamelles > 0 && (
                <div className="mt-1 flex justify-between text-slate">
                  <span>
                    Gamelle{plats > 1 ? "s" : ""} ({plats} × {f(menu.gamelle)})
                  </span>
                  <span className="tabular-nums">{f(gamelles)}</span>
                </div>
              )}
              {modeChoisi.prix > 0 && (
                <div className="mt-1 flex justify-between text-slate">
                  <span>{modeChoisi.libelle}</span>
                  <span className="tabular-nums">{f(modeChoisi.prix)}</span>
                </div>
              )}
              <div className="mt-1.5 flex justify-between text-[15px] font-extrabold">
                <span>Total</span>
                <span className="tabular-nums">{f(total)}</span>
              </div>
            </div>
          </div>

          {cadeau && (
            <div className="mt-2.5 rounded-[14px] bg-[var(--v-doux,#fde7ef)] px-3.5 py-2.5 text-[13.5px] font-extrabold text-[var(--v-fonce,#c2185b)]">
              <Icon name="gift" size={15} strokeWidth={2} className="mr-1.5 inline-block align-[-2px]" />Carte fidélité : {cadeau} avec cette commande
            </div>
          )}

          {push === "default" && (
            <button
              onClick={activerNotifs}
              className="mt-2.5 flex w-full items-center gap-2.5 rounded-[14px] bg-surface-2 px-3.5 py-3 text-left"
            >
              <Icon name="bell" size={18} className="flex-none text-teal-dark" />
              <span className="text-[12.5px] leading-snug text-slate">
                <b className="text-ink">Active les notifications</b> pour être prévenu quand ta commande est prête.
              </span>
            </button>
          )}

          {modeChoisi.adresse ? (
            <div className="mb-1.5 mt-4 text-[13px] font-bold text-ink-soft">
              <Icon name="pin" size={15} strokeWidth={2} className="mr-1 inline-block align-[-2px]" />Où te livrer ? <span className="font-medium text-[var(--v-accent,#0a7f77)]">— obligatoire</span>
            </div>
          ) : (
            <div className="mb-1.5 mt-4 text-[13px] font-bold text-ink-soft">
              Une précision pour {vendeurNom} ? <span className="font-medium text-slate-light">— facultatif</span>
            </div>
          )}
          <input
            ref={champAdresse}
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
            maxLength={200}
            placeholder={modeChoisi.adresse ? "Ex. : Cité Les Palmiers, chambre 12" : "Ex. : je passe vers 12h30"}
            className={`h-[48px] w-full rounded-[14px] border-[1.5px] px-3.5 text-[14.5px] outline-none focus:border-teal ${
              manqueAdresse ? "border-[var(--v-bord,#f0a3bd)]" : "border-line-4"
            }`}
          />
          <p className="mt-3 text-[12.5px] leading-snug text-slate-light">
            WhatsApp s&rsquo;ouvre avec ta commande déjà écrite. Tu l&rsquo;envoies, et {vendeurNom} te prévient
            quand elle est prête.
          </p>

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
                {nbArticles} article{nbArticles > 1 ? "s" : ""} · {f(total)}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[15.5px] font-extrabold">
                {pending ? "Ouverture…" : manqueAdresse ? "Où te livrer ?" : "Commander"}
                <Icon name="right" size={17} strokeWidth={2.4} />
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* One item of the menu: its sizes, its choice if it has one, and "add". */
function CarteItem({
  item,
  icone,
  epuises,
  onAjouter,
}: {
  item: ItemMenu;
  icone?: string;
  epuises: ReadonlySet<string>;
  onAjouter: (l: LigneMenu) => void;
}) {
  const [taille, setTaille] = useState(item.tailles.length === 1 ? item.tailles[0].id : item.tailles[Math.min(1, item.tailles.length - 1)].id);
  const [choix, setChoix] = useState<string | undefined>(undefined);
  const epuise = itemEpuise(item, epuises);
  const manqueChoix = !!item.choix && !choix;
  // How many to add at once: two plates for two friends without tapping "Ajouter" twice.
  const [quantite, setQuantite] = useState(1);
  const prix = item.tailles.find((t) => t.id === taille)?.prix ?? 0;

  return (
    <div className={`rounded-[18px] border border-line bg-white p-3 ${epuise ? "opacity-55" : ""}`}>
      <div className="flex gap-3">
        <div className="relative grid h-[72px] w-[72px] flex-none place-items-center overflow-hidden rounded-[14px] bg-[var(--v-doux,#f1f5f6)]">
          {item.photo ? (
            <Image src={item.photo} alt={item.nom} fill sizes="72px" className="object-cover" />
          ) : (
            icone && <span className="text-[var(--v-accent,#0a7f77)]"><IconeEmoji emoji={icone} size={34} /></span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15.5px] font-extrabold leading-tight">{item.nom}</div>
          {item.description && <div className="mt-0.5 text-[12.5px] leading-snug text-slate-light">{item.description}</div>}
        </div>
      </div>

      {item.tailles.length > 1 && (
        <div className="mt-2.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${item.tailles.length}, minmax(0, 1fr))` }}>
          {item.tailles.map((t) => (
            <button
              key={t.id}
              onClick={() => setTaille(t.id)}
              className={`rounded-[12px] border-[1.5px] px-1 py-1.5 text-center ${
                taille === t.id ? "border-[var(--v-accent,#14b8ac)] bg-[var(--v-doux,#f4fbfa)]" : "border-line-4"
              }`}
            >
              <span className="block text-[12px] font-bold text-slate">{t.nom}</span>
              <span className="block text-[13.5px] font-extrabold tabular-nums">{f(t.prix)}</span>
            </button>
          ))}
        </div>
      )}

      {item.choix && (
        <div className="mt-2.5">
          <div className="text-[12px] font-bold text-slate-light">{item.choix.titre}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.choix.options.map((o) => (
              <button
                key={o}
                onClick={() => setChoix(o)}
                disabled={epuises.has(cleEpuise(item.id, o))}
                className={`h-[34px] rounded-full px-3 text-[12.5px] font-bold disabled:line-through disabled:opacity-45 ${
                  choix === o ? "bg-[var(--v-accent,#14b8ac)] text-white" : "border-[1.5px] border-line-4 text-slate"
                }`}
              >
                {o}
                {epuises.has(cleEpuise(item.id, o)) && <span className="ml-1 no-underline">· épuisé</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <div className="flex h-[44px] flex-none items-center rounded-[13px] border-[1.5px] border-line-4">
          <button
            onClick={() => setQuantite((q) => Math.max(1, q - 1))}
            disabled={quantite <= 1}
            aria-label="Un de moins"
            className="grid h-full w-10 place-items-center disabled:opacity-30"
          >
            <Icon name="minus" size={15} strokeWidth={2.4} />
          </button>
          <span className="w-6 text-center text-[16px] font-extrabold tabular-nums">{quantite}</span>
          <button
            onClick={() => setQuantite((q) => Math.min(MAX_PAR_LIGNE, q + 1))}
            aria-label="Un de plus"
            className="grid h-full w-10 place-items-center"
          >
            <Icon name="plus" size={15} strokeWidth={2.4} />
          </button>
        </div>
        <button
          onClick={() => {
            onAjouter({ item: item.id, taille, choix, quantite });
            setQuantite(1);
          }}
          disabled={manqueChoix || epuise}
          className="press-scale flex h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[13px] bg-[var(--v-accent,#0f172a)] px-2 text-[14px] font-bold text-white disabled:opacity-40"
        >
          <Icon name="plus" size={16} strokeWidth={2.4} />
          <span className="truncate">
            {epuise
              ? "Épuisé aujourd'hui"
              : manqueChoix
              ? `Choisis ${item.choix!.titre.toLowerCase()}`
              : `Ajouter${quantite > 1 ? ` ${quantite}` : ""} · ${f(prix * quantite)}`}
          </span>
        </button>
      </div>
    </div>
  );
}
