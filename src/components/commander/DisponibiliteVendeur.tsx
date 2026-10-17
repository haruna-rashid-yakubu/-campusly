"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerEpuise, basculerRuptureVendeur } from "@/lib/actions";

/*
 * "Épuisé" from the vendor's own link, so a dish that has run out stops
 * being ordered without anyone having to call Campusly. One tap each way.
 *
 * A restaurant's list is for today only: it is wiped every morning, so
 * nothing stays off by mistake. A shop selling by flavour keeps its flavour
 * off until it puts it back — its stock does not refill overnight.
 */
type LigneMenu = { cle: string; nom: string; epuise: boolean; options: { cle: string; nom: string; epuise: boolean }[] };
type LigneArticle = { id: number; nom: string; enRupture: boolean };

export function DisponibiliteVendeur({
  token,
  menu,
  articles,
}: {
  token: string;
  menu?: LigneMenu[];
  articles?: LigneArticle[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const lancer = (f: () => Promise<unknown>) =>
    startTransition(async () => {
      await f();
      router.refresh();
    });

  const nbEpuises = menu
    ? menu.reduce((n, i) => n + (i.epuise ? 1 : 0) + i.options.filter((o) => o.epuise).length, 0)
    : (articles ?? []).filter((a) => a.enRupture).length;

  return (
    <details className="mt-4 rounded-[16px] border border-line-4 bg-white" open={nbEpuises > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <span className="text-[15px] font-extrabold">{menu ? "Disponible aujourd'hui" : "Disponibilité"}</span>
        <span className={`text-[12.5px] font-bold ${nbEpuises > 0 ? "text-warn-ink" : "text-slate-light"}`}>
          {nbEpuises > 0 ? `${nbEpuises} épuisé${nbEpuises > 1 ? "s" : ""}` : "Tout est disponible"} ▾
        </span>
      </summary>
      <div className="border-t border-line-3 px-4 pb-3">
        <p className="pt-2.5 text-[12.5px] leading-snug text-slate-light">
          {menu
            ? "Touche un article quand il est fini : les étudiants ne peuvent plus le commander. Tout redevient disponible demain matin."
            : "Touche un parfum quand il est fini : les étudiants ne peuvent plus le choisir, jusqu'à ce que tu le remettes."}
        </p>
        {menu?.map((i) => (
          <div key={i.cle} className="border-b border-line-3 py-2.5 last:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[14.5px] font-bold ${i.epuise ? "text-slate-light line-through" : ""}`}>{i.nom}</span>
              <Interrupteur
                epuise={i.epuise}
                disabled={pending}
                onClick={() => lancer(() => basculerEpuise(token, i.cle, !i.epuise))}
              />
            </div>
            {i.options.length > 0 && !i.epuise && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {i.options.map((o) => (
                  <button
                    key={o.cle}
                    disabled={pending}
                    onClick={() => lancer(() => basculerEpuise(token, o.cle, !o.epuise))}
                    className={`h-[32px] rounded-full px-3 text-[12.5px] font-bold disabled:opacity-60 ${
                      o.epuise ? "bg-warn-tint text-warn-ink line-through" : "border-[1.5px] border-line-4 text-slate"
                    }`}
                  >
                    {o.nom}
                    {o.epuise ? " · épuisé" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {articles?.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 border-b border-line-3 py-2.5 last:border-b-0">
            <span className={`text-[14.5px] font-bold ${a.enRupture ? "text-slate-light line-through" : ""}`}>{a.nom}</span>
            <Interrupteur
              epuise={a.enRupture}
              disabled={pending}
              onClick={() => lancer(() => basculerRuptureVendeur(token, a.id, !a.enRupture))}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function Interrupteur({ epuise, disabled, onClick }: { epuise: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press-scale h-[36px] flex-none rounded-full px-3.5 text-[13px] font-extrabold disabled:opacity-60 ${
        epuise ? "bg-warn-tint text-warn-ink" : "bg-teal-tint text-teal-active"
      }`}
    >
      {epuise ? "Épuisé · remettre" : "Disponible"}
    </button>
  );
}
