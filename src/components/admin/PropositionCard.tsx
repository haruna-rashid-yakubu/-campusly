"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { repondreProposition } from "@/lib/actions";

export type PropositionRow = {
  id: number;
  classeLabel: string;
  semaineLabel: string;
  photoUrl: string;
  note: string | null;
  auteur: string | null;
};

export function PropositionCard({ proposition }: { proposition: PropositionRow }) {
  const router = useRouter();
  const { show } = useToast();
  const [envoi, startTransition] = useTransition();
  const [motif, setMotif] = useState("");
  const [refus, setRefus] = useState(false);

  const repondre = (decision: "publie" | "refuse") => {
    startTransition(async () => {
      try {
        await repondreProposition(proposition.id, decision, motif);
        show(
          decision === "publie"
            ? `${proposition.classeLabel} est en ligne`
            : "Proposition refusée"
        );
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Action impossible", "warn");
      }
    });
  };

  return (
    <div className="mb-3.5 overflow-hidden rounded-[20px] border border-line">
      <div className="flex items-center gap-3 p-3.5">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-teal text-[14px] font-extrabold text-white">
          {proposition.auteur?.[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-extrabold">
            {proposition.classeLabel}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-slate-light">
            {proposition.semaineLabel} · {proposition.auteur ?? "un étudiant"}
          </span>
        </span>
      </div>

      <span className="relative block aspect-[4/3] w-full bg-line-3">
        <Image
          src={proposition.photoUrl}
          alt={`Tableau ${proposition.classeLabel}`}
          fill
          className="object-cover"
        />
      </span>

      {proposition.note && (
        <p className="border-t border-line-3 px-3.5 py-3 text-[13.5px] leading-snug text-ink-soft">
          « {proposition.note} »
        </p>
      )}

      <div className="border-t border-line-3 p-3.5">
        {refus && (
          <input
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Pourquoi ? L'étudiant le lira."
            className="mb-2.5 h-[48px] w-full rounded-[13px] border-[1.5px] border-line-2 bg-white px-3.5 text-[14.5px] font-semibold text-ink outline-none focus:border-teal"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => repondre("publie")}
            disabled={envoi}
            className="press-scale flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-teal text-[14.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
          >
            <Icon name="check" size={18} strokeWidth={2.2} />
            Publier
          </button>
          <button
            onClick={() => (refus ? repondre("refuse") : setRefus(true))}
            disabled={envoi}
            className="h-[48px] rounded-[13px] border-[1.5px] border-line-2 px-4 text-[14.5px] font-bold text-slate-light disabled:opacity-60 active:bg-surface-2"
          >
            {refus ? "Confirmer le refus" : "Refuser"}
          </button>
        </div>
        <p className="mt-2.5 text-[12px] leading-snug text-slate-light">
          Publier met la photo en ligne tout de suite et prévient la promo. La grille des
          horaires se remplit après, juste en dessous.
        </p>
      </div>
    </div>
  );
}
