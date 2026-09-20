import Link from "next/link";
import { Icon } from "@/components/icons";
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
  const isPdf = fileUrl ? /\.pdf(\?|$)/i.test(fileUrl) : false;

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
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="press-scale grid h-11 w-11 place-items-center"
            aria-label="Télécharger"
          >
            <Icon name="down" size={21} strokeWidth={2} />
          </a>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      <div className="absolute inset-x-5" style={{ top: "calc(90px + var(--safe-top))", bottom: "calc(90px + var(--safe-bottom))" }}>
        {!fileUrl && (
          <div className="grid h-full place-items-center rounded-lg bg-[#1c2735] text-[13px] font-semibold text-slate-light">
            Aperçu indisponible pour ce contenu de démonstration
          </div>
        )}
        {fileUrl && isPdf && (
          <iframe src={fileUrl} title={title} className="h-full w-full rounded-lg border-0" />
        )}
        {fileUrl && !isPdf && <ZoomViewer url={fileUrl} />}
      </div>
    </div>
  );
}
