"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { downloadFile } from "@/lib/download";
import { ZoomViewer } from "@/components/ZoomViewer";
import { estIPhone } from "@/lib/ua";

export function FullscreenViewer({
  title,
  fileUrl,
  closeHref,
}: {
  title: string;
  fileUrl: string | null;
  closeHref: string;
}) {
  const { show } = useToast();
  const isPdf = fileUrl ? /\.pdf(\?|$)/i.test(fileUrl) : false;

  /*
   * iOS cannot read a PDF inside a frame. WebKit renders the first page and
   * refuses to scroll past it, so an iframe here hands an iPhone student page
   * one of a four-page paper with no way to reach the rest — and no sign that
   * anything is missing. Its own full-screen reader does the job properly,
   * with every page and pinch-zoom, so on iPhone we send them there instead
   * of pretending to show it.
   *
   * Read after mount: the server has no idea which phone is asking, and
   * guessing would make the first render disagree with the second.
   */
  const [surIPhone, setSurIPhone] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSurIPhone(estIPhone(navigator.userAgent));
  }, []);

  const ouvrirHorsPage = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  // Synchronous for the same reason as the download button: an await here
  // spends the tap that Safari requires the download to come from.
  const handleDownload = () => {
    if (!fileUrl) return;
    try {
      downloadFile(fileUrl);
    } catch {
      show("Téléchargement impossible", "warn");
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-ink anim-fade">
      <div
        className="absolute inset-x-3.5 z-10 flex items-center justify-between text-white"
        style={{ top: "calc(14px + var(--safe-top))" }}
      >
        <Link
          href={closeHref}
          className="press-scale grid h-11 w-11 place-items-center"
          aria-label="Fermer"
        >
          <Icon name="x" size={21} strokeWidth={2} />
        </Link>
        <span className="max-w-[60%] truncate text-[14px] font-bold">{title}</span>
        {fileUrl ? (
          <button
            onClick={handleDownload}
            className="press-scale grid h-11 w-11 place-items-center"
            aria-label="Télécharger"
          >
            <Icon name="down" size={21} strokeWidth={2} />
          </button>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{ top: "calc(64px + var(--safe-top))", bottom: "calc(24px + var(--safe-bottom))" }}
      >
        <div style={{ width: "95%", height: "90%" }}>
          {!fileUrl && (
            <div className="grid h-full place-items-center rounded-lg bg-[#1c2735] text-[13px] font-semibold text-slate-light">
              Aperçu indisponible pour ce contenu de démonstration
            </div>
          )}
          {fileUrl && isPdf && surIPhone && (
            <div className="grid h-full place-items-center rounded-lg bg-white px-7 text-center">
              <span>
                <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[19px] bg-teal-tint text-teal-dark">
                  <Icon name="doc" size={30} strokeWidth={1.9} />
                </span>
                <span className="block text-[16px] font-extrabold">{title}</span>
                <span className="mt-1.5 block text-[13.5px] leading-snug text-slate">
                  Sur iPhone, le sujet s&rsquo;ouvre dans le lecteur du téléphone — toutes les
                  pages, et le zoom avec deux doigts.
                </span>
                <button
                  onClick={ouvrirHorsPage}
                  className="press-scale mt-5 h-[52px] w-full rounded-2xl bg-teal text-[15px] font-bold text-white active:bg-teal-press"
                >
                  Ouvrir le sujet
                </button>
                <button
                  onClick={handleDownload}
                  className="mt-1 h-[46px] w-full text-[14px] font-bold text-slate-light"
                >
                  Enregistrer dans Fichiers
                </button>
              </span>
            </div>
          )}
          {fileUrl && isPdf && !surIPhone && (
            <div className="relative h-full w-full">
              {/* The document itself, read by the browser's own PDF viewer.
                  It used to go through Google's viewer in an iframe, which
                  meant every paper was fetched by a third party, re-rendered,
                  and sent again — slow on a weak connection, and blank often
                  enough that students reported sujets as missing. */}
              <iframe
                src={fileUrl}
                title={title}
                className="h-full w-full rounded-lg border-0 bg-white"
              />
              {/* An escape hatch, because a frame that comes up blank gives a
                  student nothing to try. */}
              <button
                onClick={ouvrirHorsPage}
                className="press-scale absolute bottom-3 left-1/2 flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-[13px] bg-ink/80 px-4 text-[12.5px] font-bold text-white"
              >
                <Icon name="up" size={16} strokeWidth={2} />
                Rien ne s&rsquo;affiche ? Ouvrir autrement
              </button>
            </div>
          )}
          {fileUrl && !isPdf && <ZoomViewer url={fileUrl} />}
        </div>
      </div>
    </div>
  );
}
