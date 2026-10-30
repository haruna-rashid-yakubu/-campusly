"use client";

import "katex/dist/katex.min.css";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Filigrane } from "@/components/Filigrane";
import type { Lecture } from "@/lib/numerisation/lecture";

type Onglet = "texte" | "original";

/*
 * A digitised paper read on the phone itself. An A4 page shrunk to a phone's
 * width sets its text at about six pixels, so the Version reconstituée is
 * shown here as text at reading size instead, reflowed to the screen, with the
 * maths, tables and marks of the PDF. The photographs it was read from are
 * one tab away, full width; a tap opens one full screen to zoom.
 */
export function LectureSujet({ lecture, filigrane }: { lecture: Lecture; filigrane: string }) {
  const [onglet, setOnglet] = useState<Onglet>("texte");
  const [plein, setPlein] = useState<string | null>(null);
  // Folded to a preview: the whole text inline pushed the rest of the page thousands of pixels down.
  const [deplie, setDeplie] = useState(false);

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[17px] font-extrabold tracking-tight">Lire sur la page</h2>
      </div>
      <div className="flex gap-1 rounded-2xl bg-surface p-1" role="tablist">
        {(["texte", "original"] as const).map((o) => (
          <button
            key={o}
            role="tab"
            aria-selected={onglet === o}
            onClick={() => setOnglet(o)}
            className={`press-scale flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[14.5px] font-bold transition-colors ${
              onglet === o ? "bg-white text-ink shadow-sm" : "text-slate"
            }`}
          >
            <Icon name={o === "texte" ? "doc" : "cam"} size={17} />
            {o === "texte" ? "Texte" : `Photos (${lecture.photos.length})`}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Filigrane texte={filigrane} />
        <div className={deplie ? "" : "max-h-[440px] overflow-hidden"}>
      {onglet === "texte" ? (
        <>
          <div
            className="lecture rounded-[20px] border border-line bg-white px-4 py-5"
            dangerouslySetInnerHTML={{ __html: lecture.html }}
          />
          <p className="mt-2.5 flex items-start gap-2 text-[13px] leading-snug text-slate">
            <Icon name="warn" size={16} className="mt-0.5 flex-none" />
            <span>
              Texte reconstitué à partir de la photo
              {lecture.aRelire ? ", avec des passages difficiles à lire" : ""}. En cas de doute sur un mot ou un chiffre,{" "}
              <button onClick={() => setOnglet("original")} className="font-bold text-teal-dark underline">
                regarde la photo
              </button>
              .
            </span>
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {lecture.photos.map((src, i) => (
            <button
              key={src}
              onClick={() => setPlein(src)}
              className="press-scale relative overflow-hidden rounded-[20px] border border-line bg-surface-3"
              aria-label={`Agrandir la page ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- served by our route, sized by the page */}
              <img src={src} alt={`Page ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} className="block w-full" />
              <span className="absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-xl bg-ink/80 px-3 text-[12.5px] font-bold text-white">
                <Icon name="full" size={16} strokeWidth={2} />
                {i + 1}/{lecture.photos.length}
              </span>
            </button>
          ))}
        </div>
      )}

        </div>
        {!deplie && (
          <div className="absolute inset-x-0 bottom-0 flex h-36 items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-1">
            <button
              onClick={() => setDeplie(true)}
              className="press-scale flex h-11 items-center gap-1.5 rounded-full border-[1.5px] border-line-4 bg-white px-5 text-[14px] font-bold shadow-sm"
            >
              {onglet === "texte" ? "Lire tout le texte" : "Voir toutes les photos"}
              <Icon name="chevD" size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {plein && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ink anim-fade">
          <div className="flex justify-end p-3" style={{ paddingTop: "calc(12px + var(--safe-top))" }}>
            <button onClick={() => setPlein(null)} className="press-scale grid h-11 w-11 place-items-center text-white" aria-label="Fermer">
              <Icon name="x" size={22} strokeWidth={2} />
            </button>
          </div>
          {/* Native pinch-zoom and panning: the page is the image, nothing else listens to touch. */}
          <div className="relative flex-1 overflow-auto" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
            <Filigrane texte={filigrane} sombre />
            {/* eslint-disable-next-line @next/next/no-img-element -- same as above */}
            <img src={plein} alt="Page agrandie" className="mx-auto block w-full max-w-[900px]" />
          </div>
        </div>
      )}
    </section>
  );
}
