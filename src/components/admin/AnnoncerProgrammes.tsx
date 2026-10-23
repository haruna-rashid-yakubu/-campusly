"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { annoncerProgrammesSemaine } from "@/lib/actions";

/*
 * Tells every promo that its week is online, for weeks entered without the
 * admin form. Two taps: it reaches every promo at once.
 */
export function AnnoncerProgrammes() {
  const [confirme, setConfirme] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const envoyer = () =>
    startTransition(async () => {
      const r = await annoncerProgrammesSemaine();
      setConfirme(false);
      setResultat(
        r.annoncees.length === 0
          ? "Aucun programme de la semaine à annoncer."
          : `Annoncé à ${r.annoncees.length} promos.`
      );
    });

  return (
    <section className="mt-3 rounded-[18px] border-[1.5px] border-line-4 bg-white p-4">
      <div className="text-[15px] font-extrabold">Annoncer les programmes de la semaine</div>
      <div className="mt-1 text-[12.5px] text-slate-light">
        Envoie « Programme de la semaine » à chaque promo dont la semaine est en ligne.
      </div>
      {resultat && <div className="mt-2 text-[13px] font-bold text-teal">{resultat}</div>}
      <button
        onClick={() => (confirme ? envoyer() : setConfirme(true))}
        disabled={pending}
        className={`press-scale mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-bold disabled:opacity-60 ${
          confirme ? "bg-warn-tint text-warn-ink" : "border-[1.5px] border-line-4 bg-white"
        }`}
      >
        <Icon name={confirme ? "warn" : "cal"} size={18} strokeWidth={1.9} />
        {pending ? "Envoi…" : confirme ? "Confirmer — ça part à toutes les promos" : "Annoncer maintenant"}
      </button>
    </section>
  );
}
