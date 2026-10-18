"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { relancerRappelDuSoir } from "@/lib/actions";

/*
 * Sends tonight's "Demain …" reminder to every promo again, from the slots as
 * they are now. Two taps, like the announcement: it reaches every phone.
 */
export function RelancerRappel() {
  const [confirme, setConfirme] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const envoyer = () =>
    startTransition(async () => {
      const r = await relancerRappelDuSoir();
      setConfirme(false);
      setResultat(r.raison === "dimanche" ? "Demain est dimanche : rien à envoyer." : `Rappel envoyé à ${r.envoyes} promos.`);
    });

  return (
    <section className="mt-3 rounded-[18px] border-[1.5px] border-line-4 bg-white p-4">
      <div className="text-[15px] font-extrabold">Relancer le rappel du soir</div>
      <div className="mt-1 text-[12.5px] text-slate-light">
        Renvoie « Demain … » à chaque promo avec ses créneaux actuels.
      </div>
      {resultat && <div className="mt-2 text-[13px] font-bold text-teal">{resultat}</div>}
      <button
        onClick={() => (confirme ? envoyer() : setConfirme(true))}
        disabled={pending}
        className={`press-scale mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-bold disabled:opacity-60 ${
          confirme ? "bg-warn-tint text-warn-ink" : "border-[1.5px] border-line-4 bg-white"
        }`}
      >
        <Icon name={confirme ? "warn" : "chat"} size={18} strokeWidth={1.9} />
        {pending ? "Envoi…" : confirme ? "Confirmer — ça part à toutes les promos" : "Relancer le rappel"}
      </button>
    </section>
  );
}
