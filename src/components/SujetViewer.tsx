"use client";

import { useState } from "react";
import { LectureSujet } from "@/components/LectureSujet";
import { LecteurPdf } from "@/components/LecteurPdf";
import type { Lecture } from "@/lib/numerisation/lecture";
import { lienOriginal } from "@/lib/fichiers";
import { DownloadButton } from "@/components/DownloadButton";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { Icon } from "@/components/icons";

type Mode = "sujet" | "correction";

/*
 * A Sujet's content: its PDF first, opened full screen in the page's own
 * reader, then the same paper to read in place — the text at the screen's
 * size, and the photographs it was read from.
 */
export function SujetViewer({
  subjectId,
  matiere,
  filiere,
  niveau,
  type,
  annee,
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
  const [ouvert, setOuvert] = useState<"reconstituee" | "originale" | null>(null);
  const activeUrl = mode === "correction" ? correctionUrl : fileUrl;
  const lecture = mode === "correction" ? lectures.correction : lectures.sujet;
  const corrige = mode === "correction";

  return (
    <>
      {hasCorrection && (
        <div className="mt-4 flex gap-1.5 rounded-2xl bg-surface-2 p-1">
          {(["sujet", "correction"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="h-[42px] flex-1 rounded-xl text-[13.5px] font-bold"
              style={{
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#0F172A" : "#64748B",
                boxShadow: mode === m ? "0 1px 3px rgba(15,23,42,.12)" : "none",
              }}
            >
              {m === "sujet" ? "Sujet" : "Corrigé"}
            </button>
          ))}
        </div>
      )}

      {activeUrl ? (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-teal-border bg-gradient-to-br from-teal-tint via-white to-white p-4 anim-fade">
          <button onClick={() => setOuvert("reconstituee")} className="flex w-full items-center gap-4 text-left" aria-label="Ouvrir le PDF">
            <Couverture matiere={matiere} type={type} corrige={corrige} />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-[.09em] text-teal-dark">
                PDF{lecture ? " · version reconstituée" : ""}
              </span>
              <span className="mt-1 line-clamp-2 block text-[17px] font-extrabold leading-tight tracking-tight">
                {corrige ? `Corrigé · ${matiere}` : matiere}
              </span>
              <span className="mt-1 block text-[13px] text-slate">
                {type} · {annee}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-slate-light">
                {filiere} · {niveau}
              </span>
            </span>
          </button>

          <button
            onClick={() => setOuvert("reconstituee")}
            className="press-scale mt-4 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal text-[16px] font-extrabold text-white shadow-[0_10px_22px_-10px_var(--color-teal)] active:bg-teal-dark"
          >
            <Icon name="full" size={19} strokeWidth={2.2} />
            Ouvrir le PDF
          </button>
          {lecture && (
            <button
              onClick={() => setOuvert("originale")}
              className="press-scale mt-1.5 flex h-11 w-full items-center justify-center gap-2 text-[13.5px] font-bold text-teal-dark"
            >
              <Icon name="cam" size={16} strokeWidth={2} />
              Version originale (photos)
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-surface-3 p-7 text-center">
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

      {lecture && (
        <>
          <div className="mt-7 text-[17px] font-extrabold tracking-tight">Ou lis-le directement ici</div>
          <LectureSujet key={mode} lecture={lecture} />
        </>
      )}

      {ouvert && activeUrl && (
        <LecteurPdf
          url={ouvert === "originale" ? lienOriginal(activeUrl) : activeUrl}
          titre={`${corrige ? "Corrigé · " : ""}${matiere}${ouvert === "originale" ? " · original" : ""}`}
          onFermer={() => setOuvert(null)}
        />
      )}

      <div
        className="fixed inset-x-0 z-[4] flex gap-2.5 bg-white px-5 pb-[18px] pt-4"
        style={{ bottom: "calc(76px + var(--safe-bottom))" }}
      >
        <DownloadButton
          fileUrl={activeUrl}
          onRecord={onRecord}
          label={corrige ? "Télécharger le corrigé" : "Télécharger"}
        />
        <WhatsAppShareButton
          text={`Regarde ce sujet sur Campusly : ${matiere} (${filiere} · ${niveau})`}
          aria-label="Partager sur WhatsApp"
          className="press-scale grid h-[54px] w-[54px] flex-none place-items-center rounded-2xl border-[1.5px] border-line-4 bg-white active:bg-teal-tint-soft"
        >
          <Icon name="chat" size={19} strokeWidth={1.9} />
        </WhatsAppShareButton>
      </div>
    </>
  );
}

// The PDF's first page in miniature: the Campusly cover every Version reconstituée opens on.
function Couverture({ matiere, type, corrige }: { matiere: string; type: string; corrige: boolean }) {
  return (
    <span className="relative block h-[122px] w-[88px] flex-none -rotate-3 rounded-[7px] bg-white p-2.5 shadow-[0_12px_26px_-12px_rgba(15,23,42,.55)] ring-1 ring-line">
      <span className="flex items-center gap-1">
        <span className="grid h-3.5 w-3.5 place-items-center rounded-[4px] bg-teal text-[7px] font-black text-white">C</span>
        <span className="text-[7px] font-extrabold">Campusly</span>
      </span>
      <span className="mt-3.5 block text-[5.5px] font-extrabold uppercase tracking-[.1em] text-teal-dark">
        {corrige ? "Corrigé" : "Sujet"} · {type}
      </span>
      <span className="mt-0.5 line-clamp-3 block text-[8.5px] font-extrabold leading-[1.15]">{matiere}</span>
      <span className="mt-2 block h-[2px] w-full rounded bg-line" />
      <span className="mt-1 block h-[2px] w-[80%] rounded bg-line" />
      <span className="mt-1 block h-[2px] w-[90%] rounded bg-line" />
      <span className="absolute -bottom-1.5 -right-2 rotate-3 rounded-md bg-[#e5484d] px-1.5 py-[3px] text-[8px] font-black tracking-wide text-white shadow-sm">
        PDF
      </span>
    </span>
  );
}
