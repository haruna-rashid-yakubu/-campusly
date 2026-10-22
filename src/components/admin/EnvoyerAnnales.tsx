"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { envoyerAnnalesEnAttente } from "@/lib/actions";

/*
 * Papers filed straight into the bank are announced by the 8h run. This sends
 * the waiting announcements now. Two taps, because they reach whole promos.
 */
export function EnvoyerAnnales() {
  const [confirme, setConfirme] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const envoyer = () =>
    startTransition(async () => {
      const r = await envoyerAnnalesEnAttente();
      setConfirme(false);
      setResultat(
        r.envoyees.length === 0
          ? "Aucune annonce d'annales en attente."
          : `Envoyé : ${r.envoyees.map((e) => `${e.promo} (${e.epreuves} épreuve${e.epreuves > 1 ? "s" : ""})`).join(", ")}.`
      );
    });

  return (
    <section className="mt-3 rounded-[18px] border-[1.5px] border-line-4 bg-white p-4">
      <div className="text-[15px] font-extrabold">Annoncer les nouvelles annales</div>
      <div className="mt-1 text-[12.5px] text-slate-light">
        Envoie tout de suite les annonces d&rsquo;épreuves en attente, sans attendre 8h.
      </div>
      {resultat && <div className="mt-2 text-[13px] font-bold text-teal">{resultat}</div>}
      <button
        onClick={() => (confirme ? envoyer() : setConfirme(true))}
        disabled={pending}
        className={`press-scale mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-bold disabled:opacity-60 ${
          confirme ? "bg-warn-tint text-warn-ink" : "border-[1.5px] border-line-4 bg-white"
        }`}
      >
        <Icon name={confirme ? "warn" : "bell"} size={18} strokeWidth={1.9} />
        {pending ? "Envoi…" : confirme ? "Confirmer l'envoi" : "Envoyer maintenant"}
      </button>
    </section>
  );
}
