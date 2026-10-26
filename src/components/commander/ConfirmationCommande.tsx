"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { lireCommande, oublierCommande, type CommandeEnvoyee } from "@/lib/panier-client";
import { fcfa } from "@/lib/utils";

/*
 * What the student sees on coming back from WhatsApp: the order went out, its
 * reference, and a way back into the conversation if the message was not sent.
 */
export function ConfirmationCommande({ vendeurId }: { vendeurId: number }) {
  const [commande, setCommande] = useState<CommandeEnvoyee | null>(null);

  useEffect(() => {
    const lire = () => setCommande(lireCommande(vendeurId));
    lire();
    window.addEventListener("campusly:commande", lire);
    window.addEventListener("pageshow", lire);
    return () => {
      window.removeEventListener("campusly:commande", lire);
      window.removeEventListener("pageshow", lire);
    };
  }, [vendeurId]);

  if (!commande) return null;
  const terminer = () => {
    oublierCommande();
    setCommande(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Commande envoyée">
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pt-[calc(56px+var(--safe-top))] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-teal-tint text-teal-dark">
          <Icon name="check" size={34} strokeWidth={2.4} />
        </span>
        <div className="mt-4 text-[24px] font-extrabold tracking-tight">Commande prête à envoyer</div>
        <p className="mt-1.5 max-w-xs text-[14.5px] leading-relaxed text-slate">
          Envoie le message dans WhatsApp : {commande.vendeurNom} te répond pour la suite.
        </p>
        <div className="mt-6 w-full max-w-sm rounded-[20px] border border-line p-4 text-left">
          <div className="flex justify-between text-[13px] text-slate">
            <span>Référence</span>
            <span className="font-extrabold text-ink tabular-nums">{commande.reference}</span>
          </div>
          <ul className="mt-3 space-y-1 border-t border-line-3 pt-3 text-[14px]">
            {commande.lignes.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line-3 pt-3 text-[15.5px] font-extrabold">
            <span>Total</span>
            <span className="tabular-nums">{fcfa(commande.total)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-5 pb-[calc(20px+var(--safe-bottom))] pt-3">
        <a
          href={commande.url}
          className="press-scale flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#1fa855] text-[15.5px] font-bold text-white"
        >
          <Icon name="chat" size={19} strokeWidth={2} />
          Rouvrir WhatsApp
        </a>
        <Link
          href="/commander"
          onClick={terminer}
          className="press-scale flex h-[50px] items-center justify-center rounded-2xl border-[1.5px] border-line-4 text-[15px] font-bold text-ink-soft"
        >
          Terminé
        </Link>
      </div>
    </div>
  );
}
