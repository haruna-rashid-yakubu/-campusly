"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { downloadFile } from "@/lib/download";
import { ZoomViewer } from "@/components/ZoomViewer";

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
          {fileUrl && isPdf && (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              title={title}
              className="h-full w-full rounded-lg border-0 bg-white"
            />
          )}
          {fileUrl && !isPdf && <ZoomViewer url={fileUrl} />}
        </div>
      </div>
    </div>
  );
}
