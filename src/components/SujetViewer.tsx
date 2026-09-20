"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePreview } from "@/components/FilePreview";
import { DownloadButton } from "@/components/DownloadButton";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { Icon } from "@/components/icons";

type Mode = "sujet" | "correction";

export function SujetViewer({
  subjectId,
  matiere,
  filiere,
  niveau,
  fileUrl,
  correctionUrl,
  onRecord,
}: {
  subjectId: number;
  matiere: string;
  filiere: string;
  niveau: string;
  fileUrl: string | null;
  correctionUrl: string | null;
  onRecord: () => Promise<void>;
}) {
  const hasCorrection = !!correctionUrl;
  const [mode, setMode] = useState<Mode>("sujet");
  const activeUrl = mode === "correction" ? correctionUrl : fileUrl;

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

      <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-surface-3">
        {activeUrl ? (
          <Link href={`/sujets/${subjectId}/plein?mode=${mode}`} className="press-scale relative block">
            <FilePreview url={activeUrl} className="h-[360px] w-full border-0" />
            <span className="absolute bottom-3 right-3 flex h-10 items-center gap-1.5 rounded-[13px] bg-ink/80 px-3.5 text-[12.5px] font-bold text-white">
              <Icon name="full" size={18} strokeWidth={2} />
              Agrandir
            </span>
          </Link>
        ) : (
          <div className="p-7 text-center">
            <div className="mx-auto mb-1 h-[11px] w-[52%] rounded-md bg-line-4" />
            <div className="mx-auto mt-5 h-2 w-[88%] rounded bg-line-3" />
            <div className="mx-auto mt-2.5 h-2 w-[94%] rounded bg-line-3" />
            <div className="mx-auto mt-2.5 h-2 w-[70%] rounded bg-line-3" />
            <div className="mt-6 text-[13px] font-semibold text-slate-light">
              {mode === "correction"
                ? "Aperçu du corrigé indisponible pour ce contenu de démonstration"
                : "Aperçu indisponible pour ce contenu de démonstration"}
            </div>
          </div>
        )}
      </div>

      <div
        className="fixed inset-x-0 z-[4] flex gap-2.5 bg-white px-5 pb-[18px] pt-4"
        style={{ bottom: "calc(76px + var(--safe-bottom))" }}
      >
        <DownloadButton
          fileUrl={activeUrl}
          onRecord={onRecord}
          label={mode === "correction" ? "Télécharger le corrigé" : "Télécharger"}
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
