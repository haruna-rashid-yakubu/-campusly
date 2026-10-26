"use client";

import { useOptimistic, useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { repondreSondage } from "@/lib/actions";
import { TexteIcone } from "@/components/TexteIcone";

/*
 * The answers are the buttons. Before a vote they are plain choices, because
 * showing the tally first nudges people towards whatever is already winning;
 * after it, the same rows fill in as bars, so the result appears where the
 * finger just was rather than somewhere below it.
 *
 * The tap is shown as done immediately and corrected only if the server
 * refuses, so a slow connection on campus does not read as a dead button.
 */
export function SondageVote({
  sondageId,
  options,
  parOption,
  maReponse,
  ouvert,
}: {
  sondageId: number;
  options: string[];
  parOption: number[];
  maReponse: number | null;
  ouvert: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const [etat, appliquer] = useOptimistic(
    { parOption, maReponse },
    (courant, choix: number) => {
      const counts = [...courant.parOption];
      if (courant.maReponse !== null) counts[courant.maReponse] = Math.max(0, counts[courant.maReponse] - 1);
      counts[choix] += 1;
      return { parOption: counts, maReponse: choix };
    }
  );

  const total = etat.parOption.reduce((a, b) => a + b, 0);
  const montrerResultats = etat.maReponse !== null || !ouvert;

  const voter = (i: number) => {
    if (!ouvert || i === etat.maReponse) return;
    startTransition(async () => {
      appliquer(i);
      const r = await repondreSondage(sondageId, i);
      if (!r.ok) show(r.message, "warn");
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        {options.map((label, i) => {
          const n = etat.parOption[i] ?? 0;
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          const choisi = etat.maReponse === i;
          return (
            <button
              key={i}
              onClick={() => voter(i)}
              disabled={!ouvert}
              aria-pressed={choisi}
              className={`press-scale relative min-h-[58px] w-full overflow-hidden rounded-[16px] border-[1.5px] text-left disabled:cursor-default ${
                choisi ? "border-teal bg-white" : "border-line-4 bg-white"
              }`}
            >
              {montrerResultats && (
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${
                    choisi ? "bg-teal-tint" : "bg-surface-2"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center gap-3 px-4 py-3">
                <TexteIcone texte={label} size={17} className="min-w-0 flex-1 text-[15.5px] font-bold leading-snug" />
                {choisi && (
                  <span className="flex-none text-teal-dark">
                    <Icon name="check" size={18} strokeWidth={2.6} />
                  </span>
                )}
                {montrerResultats && (
                  <span className="flex-none text-[14.5px] font-extrabold tabular-nums">{pct} %</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3.5 text-center text-[13px] text-slate-light">
        {montrerResultats
          ? `${total} réponse${total > 1 ? "s" : ""}${
              ouvert ? (pending ? " · enregistrement…" : " · tu peux changer d'avis tant que c'est ouvert") : ""
            }`
          : "Touche ta réponse : les résultats s'affichent juste après."}
      </p>
    </div>
  );
}
