"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { definirTroncCommun } from "@/lib/actions";

const INPUT =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal";

export type LienTroncCommun = { classe: string; suit: string };

export function TroncCommunForm({
  classes,
  liens,
}: {
  classes: string[];
  liens: LienTroncCommun[];
}) {
  const router = useRouter();
  const { show } = useToast();
  const [envoi, startTransition] = useTransition();

  const [classe, setClasse] = useState(classes[0] ?? "");
  const [source, setSource] = useState(classes[1] ?? "");

  const appliquer = (cible: string, src: string | null) => {
    startTransition(async () => {
      try {
        const r = await definirTroncCommun(cible, src);
        if (!r.ok) {
          show(r.message, "warn");
          return;
        }
        show(src ? `${cible} suit ${src}` : `${cible} publie de nouveau son programme`);
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Action impossible", "warn");
      }
    });
  };

  return (
    <div className="mt-8 rounded-[20px] border border-line p-4">
      <div className="text-[16px] font-extrabold tracking-tight">Tronc commun</div>
      <p className="mb-3.5 mt-1 text-[12.5px] leading-snug text-slate-light">
        Une promo qui suit une autre affiche son emploi du temps, sans copie à entretenir. Tu
        publies une fois, les deux sont à jour.
      </p>

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Cette promo</label>
      <select
        value={classe}
        onChange={(e) => setClasse(e.target.value)}
        className={`${INPUT} mb-3.5`}
      >
        {classes.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
        suit le programme de
      </label>
      <select
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className={`${INPUT} mb-4`}
      >
        {classes
          .filter((c) => c !== classe)
          .map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
      </select>

      <button
        onClick={() => appliquer(classe, source)}
        disabled={envoi || !classe || !source || classe === source}
        className="press-scale h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        {envoi ? "Enregistrement…" : "Lier les deux promos"}
      </button>

      <div className="mb-2 mt-6 text-[14.5px] font-extrabold">
        {liens.length} promo{liens.length > 1 ? "s" : ""} en tronc commun
      </div>
      {liens.length === 0 ? (
        <p className="text-[13.5px] text-slate-light">
          Aucune pour l&rsquo;instant : chaque promo publie la sienne.
        </p>
      ) : (
        liens.map((l) => (
          <div key={l.classe} className="flex items-center gap-3 border-t border-line-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-bold">{l.classe}</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-slate-light">
                suit {l.suit}
              </span>
            </span>
            <button
              onClick={() => appliquer(l.classe, null)}
              disabled={envoi}
              className="h-9 flex-none rounded-xl px-3 text-[13px] font-bold text-slate-light active:bg-surface-2"
            >
              Couper
            </button>
          </div>
        ))
      )}
    </div>
  );
}
