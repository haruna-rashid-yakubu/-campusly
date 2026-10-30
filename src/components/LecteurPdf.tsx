"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { downloadFile } from "@/lib/download";

/*
 * A Sujet's PDF, read full screen on the page itself.
 *
 * Google's viewer needed a public link, and a phone's own reader either shows
 * an A4 page at six pixels or, on Android, drops the file in Downloads. Here
 * pdf.js draws each page at the width of the screen, sharp at the screen's
 * density, with a zoom for the small print. The worker is served from
 * /public, copied from pdfjs-dist at the same version.
 *
 * Opening it adds a step to the history, so the phone's back button closes
 * the viewer instead of leaving the Sujet.
 */
const WORKER = "/pdfjs/pdf.worker-6.4.299.min.mjs";
const ZOOMS = [1, 1.6, 2.2];

type Etat = { t: "chargement"; part: number } | { t: "pret"; pages: number } | { t: "erreur" };

export function LecteurPdf({
  source,
  titre,
  onTelecharger,
  onFermer,
}: {
  // A Sujet's address, or the bytes of a PDF made on the spot (the tutor's report).
  source: string | Uint8Array;
  titre: string;
  onTelecharger?: () => void;
  onFermer: () => void;
}) {
  const telecharger = () => (onTelecharger ? onTelecharger() : typeof source === "string" && downloadFile(source));
  const [etat, setEtat] = useState<Etat>({ t: "chargement", part: 0 });
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(0);
  const pagesRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const fermerRef = useRef(onFermer);
  useEffect(() => {
    fermerRef.current = onFermer;
  });

  // The back button closes the viewer: one history step, pushed once.
  useEffect(() => {
    // Once: a second mount (React's development check) must not add a second step.
    if (!(window.history.state as Record<string, unknown> | null)?.lecteurPdf) window.history.pushState({ ...window.history.state, lecteurPdf: true }, "");
    // Layers stack (the report's reader opens over the tutor): close only when this one's step is left.
    const retour = () => {
      if (!(window.history.state as Record<string, unknown> | null)?.lecteurPdf) fermerRef.current();
    };
    window.addEventListener("popstate", retour);
    const defilement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", retour);
      document.body.style.overflow = defilement;
    };
  }, []);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
        // pdf.js takes the bytes it is given: a copy, so the caller keeps its own.
        const tache = pdfjs.getDocument(
          typeof source === "string" ? { url: source, disableRange: true, disableStream: true } : { data: source.slice() }
        );
        tache.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (!annule && total) setEtat({ t: "chargement", part: Math.min(loaded / total, 1) });
        };
        const doc = await tache.promise;
        if (annule) return void doc.loadingTask.destroy();
        docRef.current = doc;
        setEtat({ t: "pret", pages: doc.numPages });
      } catch {
        if (!annule) setEtat({ t: "erreur" });
      }
    })();
    return () => {
      annule = true;
      void docRef.current?.loadingTask.destroy();
      docRef.current = null;
    };
  }, [source]);

  // Every page drawn at the column's width times the zoom, at the screen's density.
  // All are sized first, so the place being read stays put while they draw.
  const position = useRef(0);
  useEffect(() => {
    const doc = docRef.current;
    const conteneur = pagesRef.current;
    if (etat.t !== "pret" || !doc || !conteneur) return;
    let annule = false;
    const largeur = Math.min(conteneur.clientWidth - 24, 900) * ZOOMS[zoom];
    const densite = Math.min(window.devicePixelRatio || 1, 3);
    (async () => {
      const pages = await Promise.all(Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1)));
      if (annule) return;
      const canvas = (n: number) => conteneur.querySelector<HTMLCanvasElement>(`canvas[data-page="${n}"]`);
      pages.forEach((p, i) => {
        const c = canvas(i + 1);
        if (!c) return;
        const base = p.getViewport({ scale: 1 });
        c.style.width = `${largeur}px`;
        c.style.height = `${(largeur * base.height) / base.width}px`;
      });
      conteneur.scrollTop = position.current * conteneur.scrollHeight;
      for (const [i, p] of pages.entries()) {
        const c = canvas(i + 1);
        if (!c || annule) return;
        const viewport = p.getViewport({ scale: (largeur / p.getViewport({ scale: 1 }).width) * densite });
        c.width = viewport.width;
        c.height = viewport.height;
        await p.render({ canvas: c, viewport }).promise.catch(() => {});
        c.dataset.pret = "1";
      }
    })();
    return () => {
      annule = true;
    };
  }, [etat, zoom]);

  const zoomer = () => {
    const conteneur = pagesRef.current;
    if (conteneur) position.current = conteneur.scrollTop / Math.max(conteneur.scrollHeight, 1);
    setZoom((z) => (z + 1) % ZOOMS.length);
  };

  // Which page is in view, for the counter.
  useEffect(() => {
    const conteneur = pagesRef.current;
    if (etat.t !== "pret" || !conteneur) return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) if (e.isIntersecting) setPage(Number((e.target as HTMLElement).dataset.page));
      },
      { root: conteneur, threshold: 0.5 }
    );
    conteneur.querySelectorAll("canvas[data-page]").forEach((c) => observateur.observe(c));
    return () => observateur.disconnect();
  }, [etat, zoom]);

  const fermer = () => window.history.back();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1220] anim-fade" role="dialog" aria-label={titre}>
      <div
        className="flex flex-none items-center gap-1 border-b border-white/10 px-2 pb-2 text-white"
        style={{ paddingTop: "calc(10px + var(--safe-top))" }}
      >
        <button onClick={fermer} className="press-scale grid h-11 w-11 place-items-center" aria-label="Fermer">
          <Icon name="x" size={21} strokeWidth={2} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-bold">{titre}</div>
          <div className="text-[12px] font-semibold text-white/60">
            {etat.t === "pret" ? `Page ${page} sur ${etat.pages}` : etat.t === "erreur" ? "PDF indisponible" : "Chargement…"}
          </div>
        </div>
        <button
          onClick={zoomer}
          disabled={etat.t !== "pret"}
          className="press-scale flex h-11 items-center gap-1 rounded-xl px-2.5 text-[13px] font-bold disabled:opacity-40"
          aria-label="Zoom"
        >
          <Icon name="search" size={18} strokeWidth={2} />
          {Math.round(ZOOMS[zoom] * 100)} %
        </button>
        <button
          onClick={telecharger}
          className="press-scale grid h-11 w-11 place-items-center"
          aria-label="Télécharger"
        >
          <Icon name="down" size={21} strokeWidth={2} />
        </button>
      </div>

      <div ref={pagesRef} className="flex-1 overflow-auto overscroll-contain" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
        {etat.t === "chargement" && (
          <div className="mx-auto flex max-w-[420px] flex-col items-center px-8 pt-16">
            <div className="cy-skeleton aspect-[1/1.414] w-full rounded-md opacity-20" />
            <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-teal transition-[width] duration-200" style={{ width: `${Math.max(etat.part, 0.08) * 100}%` }} />
            </div>
          </div>
        )}
        {etat.t === "erreur" && (
          <div className="px-8 pt-24 text-center text-white">
            <div className="text-[16px] font-extrabold">Impossible d&rsquo;afficher ce PDF ici</div>
            <p className="mx-auto mt-2 max-w-xs text-[14px] text-white/70">Tu peux le télécharger pour l&rsquo;ouvrir sur ton téléphone.</p>
            <button
              onClick={telecharger}
              className="press-scale mx-auto mt-6 flex h-12 items-center gap-2 rounded-2xl bg-teal px-6 text-[15px] font-bold text-white"
            >
              <Icon name="down" size={18} strokeWidth={2} />
              Télécharger
            </button>
          </div>
        )}
        {etat.t === "pret" && (
          <div className="flex w-max min-w-full flex-col items-center gap-3 px-3 py-4" style={{ paddingBottom: "calc(24px + var(--safe-bottom))" }}>
            {Array.from({ length: etat.pages }, (_, i) => (
              <canvas
                key={`${i}-${zoom}`}
                data-page={i + 1}
                className="block rounded-[3px] bg-white shadow-[0_6px_24px_rgba(0,0,0,.45)]"
                style={{ width: "min(100%, 900px)", aspectRatio: "1 / 1.414" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
