"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { Icon } from "@/components/icons";
import { LecteurPdf } from "@/components/LecteurPdf";
import { LectureSujet } from "@/components/LectureSujet";
import { Couverture } from "@/components/SujetViewer";
import type { Lecture } from "@/lib/numerisation/lecture";

type Mode = "sujet" | "corrige";

/*
 * A Sujet d'entraînement's content, laid out like a past paper's: the paper
 * or its corrigé in PDF first, then the same text to read in place. The
 * corrigé is one tab away, so a student can sit the paper first and check
 * afterwards.
 */
export function EntrainementViewer({
  matiere,
  type,
  urls,
  lectures,
}: {
  matiere: string;
  type: string;
  urls: { sujet: string; corrige: string };
  lectures: { sujet: Lecture; corrige: Lecture };
}) {
  const [mode, setMode] = useState<Mode>("sujet");
  const [ouvert, setOuvert] = useState(false);
  const corrige = mode === "corrige";

  return (
    <>
      <div className="mt-5 flex gap-1 rounded-2xl bg-surface-2 p-1">
        {(["sujet", "corrige"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`h-10 flex-1 rounded-xl text-[13.5px] font-bold transition-colors ${
              mode === m ? "bg-white text-ink shadow-sm" : "text-slate"
            }`}
          >
            {m === "sujet" ? "Sujet" : "Corrigé"}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[22px] border border-line bg-white p-3 shadow-[0_8px_24px_-16px_rgba(15,23,42,.35)]">
        <button
          onClick={() => setOuvert(true)}
          className="press-scale flex w-full items-center gap-3.5 rounded-[16px] bg-surface p-3 text-left"
        >
          <Couverture matiere={matiere} type={type} corrige={corrige} nature={corrige ? "Corrigé · Entraînement" : `Entraînement · ${type}`} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-extrabold leading-snug">
              {corrige ? "Le corrigé en PDF" : "Le sujet complet en PDF"}
            </span>
            <span className="mt-1 block text-[13px] leading-snug text-slate">
              {corrige ? "Rédigé puis revérifié par l'IA" : "À faire en temps limité, comme le jour de l'examen"}
            </span>
          </span>
          <Icon name="right" size={18} className="flex-none text-slate-light" />
        </button>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setOuvert(true)}
            className="press-scale flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal text-[15.5px] font-extrabold text-white active:bg-teal-dark"
          >
            <Icon name="full" size={18} strokeWidth={2.2} />
            Ouvrir le PDF
          </button>
          <DownloadButton
            compact
            fileUrl={corrige ? urls.corrige : urls.sujet}
            label={corrige ? "Télécharger le corrigé" : "Télécharger le sujet"}
            className="press-scale grid h-[52px] w-[52px] flex-none place-items-center rounded-2xl border-[1.5px] border-line-4 bg-white text-ink active:bg-surface-3"
          />
        </div>
      </div>

      <LectureSujet key={mode} lecture={corrige ? lectures.corrige : lectures.sujet} />

      {ouvert && (
        <LecteurPdf
          source={corrige ? urls.corrige : urls.sujet}
          titre={`${corrige ? "Corrigé · " : ""}${matiere}`}
          onFermer={() => setOuvert(false)}
        />
      )}
    </>
  );
}
