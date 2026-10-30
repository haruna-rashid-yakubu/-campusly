"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LectureSujet } from "@/components/LectureSujet";
import { LecteurPdf } from "@/components/LecteurPdf";
import type { Lecture } from "@/lib/numerisation/lecture";
import { DownloadButton } from "@/components/DownloadButton";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { Icon } from "@/components/icons";

// Loaded on first open: KaTeX and the conversation weigh nothing until then.
const TuteurIA = dynamic(
  () => import("@/components/TuteurIA").then((m) => m.TuteurIA),
  { ssr: false },
);

type Mode = "sujet" | "correction";

/*
 * A Sujet's content: its PDF first — one card, opened full screen in the
 * page's own reader, downloaded or shared from the same row — then the same
 * paper to read in place, folded until asked for.
 */
export function SujetViewer({
  subjectId,
  matiere,
  filiere,
  niveau,
  type,
  fileUrl,
  correctionUrl,
  lectures,
  onRecord,
}: {
  subjectId: number;
  matiere: string;
  filiere: string;
  niveau: string;
  type: string;
  annee: string;
  fileUrl: string | null;
  correctionUrl: string | null;
  // The digitised text and photos, when the paper has been through the digitisation.
  lectures: { sujet: Lecture | null; correction: Lecture | null };
  onRecord: () => Promise<void>;
}) {
  const hasCorrection = !!correctionUrl;
  const [mode, setMode] = useState<Mode>("sujet");
  const [ouvert, setOuvert] = useState(false);
  // ?tuteur=1 (from the assistant's "Réviser" button) opens the tutor straight away.
  const params = useSearchParams();
  const [tuteur, setTuteur] = useState(() => params.get("tuteur") === "1" && !!lectures.sujet);
  const activeUrl = mode === "correction" ? correctionUrl : fileUrl;
  const lecture = mode === "correction" ? lectures.correction : lectures.sujet;
  const corrige = mode === "correction";
  const feuilles = lecture?.photos.length ?? 0;

  return (
    <>
      {hasCorrection && (
        <div className="mt-5 flex gap-1 rounded-2xl bg-surface-2 p-1">
          {(["sujet", "correction"] as const).map((m) => (
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
      )}

      {activeUrl ? (
        <div className="mt-5 rounded-[22px] border border-line bg-white p-3 shadow-[0_8px_24px_-16px_rgba(15,23,42,.35)]">
          <button
            onClick={() => setOuvert(true)}
            className="press-scale flex w-full items-center gap-3.5 rounded-[16px] bg-surface p-3 text-left"
          >
            <Couverture matiere={matiere} type={type} corrige={corrige} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-extrabold leading-snug">
                {corrige ? "Le corrigé en PDF" : "Le sujet complet en PDF"}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-slate">
                {lecture
                  ? `${feuilles} feuille${feuilles > 1 ? "s" : ""} retranscrite${feuilles > 1 ? "s" : ""}, net et lisible sur ton téléphone`
                  : "Le document tel qu'il a été envoyé"}
              </span>
            </span>
            <Icon
              name="right"
              size={18}
              className="flex-none text-slate-light"
            />
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
              fileUrl={activeUrl}
              onRecord={onRecord}
              label={corrige ? "Télécharger le corrigé" : "Télécharger le PDF"}
              className="press-scale grid h-[52px] w-[52px] flex-none place-items-center rounded-2xl border-[1.5px] border-line-4 bg-white text-ink active:bg-surface-3"
            />
            {lecture ? (
              // The revision tutor needs the digitised text; a paper without it keeps the share button.
              <button
                onClick={() => setTuteur(true)}
                aria-label="Réviser avec l'IA"
                className="press-scale flex h-[52px] w-[52px] flex-none flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] border-teal-border bg-teal-tint text-teal-dark active:bg-teal-border"
              >
                <Icon name="spark" size={18} strokeWidth={2} />
                <span className="text-[10px] font-black leading-none tracking-wide">
                  IA
                </span>
              </button>
            ) : (
              <WhatsAppShareButton
                text={`Regarde ce sujet sur Campusly : ${matiere} (${filiere} · ${niveau})`}
                aria-label="Partager sur WhatsApp"
                className="press-scale grid h-[52px] w-[52px] flex-none place-items-center rounded-2xl border-[1.5px] border-line-4 bg-white active:bg-surface-3"
              >
                <Icon name="chat" size={19} strokeWidth={1.9} />
              </WhatsAppShareButton>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[20px] border border-line bg-surface-3 p-7 text-center">
          <div className="mx-auto mb-1 h-[11px] w-[52%] rounded-md bg-line-4" />
          <div className="mx-auto mt-5 h-2 w-[88%] rounded bg-line-3" />
          <div className="mx-auto mt-2.5 h-2 w-[94%] rounded bg-line-3" />
          <div className="mx-auto mt-2.5 h-2 w-[70%] rounded bg-line-3" />
          <div className="mt-6 text-[13px] font-semibold text-slate-light">
            {corrige
              ? "Aperçu du corrigé indisponible pour ce contenu de démonstration"
              : "Aperçu indisponible pour ce contenu de démonstration"}
          </div>
        </div>
      )}

      {lecture && <LectureSujet key={mode} lecture={lecture} />}

      {tuteur && (
        <TuteurIA
          subjectId={subjectId}
          matiere={matiere}
          corrige={corrige}
         
          onFermer={() => setTuteur(false)}
        />
      )}

      {ouvert && activeUrl && (
        <LecteurPdf
          source={activeUrl}
          titre={`${corrige ? "Corrigé · " : ""}${matiere}`}
         
          onFermer={() => setOuvert(false)}
        />
      )}
    </>
  );
}

// The PDF's first page in miniature: the Campusly cover every Version reconstituée opens on.
function Couverture({
  matiere,
  type,
  corrige,
}: {
  matiere: string;
  type: string;
  corrige: boolean;
}) {
  return (
    <span className="relative block h-[86px] w-[64px] flex-none rounded-[6px] bg-white p-2 shadow-[0_6px_14px_-8px_rgba(15,23,42,.5)] ring-1 ring-line">
      <span className="flex items-center gap-[3px]">
        <span className="h-2.5 w-2.5 rounded-[3px] bg-teal" />
        <span className="text-[5.5px] font-extrabold">Campusly</span>
      </span>
      <span className="mt-2.5 block text-[4.5px] font-extrabold uppercase tracking-[.1em] text-teal-dark">
        {corrige ? "Corrigé" : "Sujet"} · {type}
      </span>
      <span className="mt-0.5 line-clamp-2 block text-[6.5px] font-extrabold leading-[1.15]">
        {matiere}
      </span>
      <span className="mt-1.5 block h-[1.5px] w-full rounded bg-line" />
      <span className="mt-1 block h-[1.5px] w-[75%] rounded bg-line" />
      <span className="absolute -bottom-1 -right-1.5 rounded-[4px] bg-[#e5484d] px-1 py-[2px] text-[7px] font-black tracking-wide text-white">
        PDF
      </span>
    </span>
  );
}
