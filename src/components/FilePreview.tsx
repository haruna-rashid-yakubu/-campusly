import Image from "next/image";
import { Icon } from "@/components/icons";

/*
 * The card above the "Agrandir" button, not a reader.
 *
 * A PDF used to be shown here through Google's viewer in an iframe, and that
 * was wrong three times over. It renders blank on iPhone often enough that
 * students reported the sujet as missing. It costs a full download of the
 * document — on a paid mobile plan — to draw something unreadable at 360px
 * high. And an iframe captures touches, so the tap that was supposed to open
 * the document full screen landed inside the frame and did nothing: only the
 * small badge in the corner worked.
 *
 * So a PDF is announced rather than rendered. It is honest about what it is,
 * it costs nothing to show, the whole card is tappable again, and the document
 * itself is fetched on the screen that exists to read it.
 */
export function FilePreview({ url, className }: { url: string; className?: string }) {
  const isPdf = /\.pdf(\?|$)/i.test(url);

  if (isPdf) {
    return (
      <div className={`grid place-items-center bg-white ${className ?? ""}`}>
        <span className="px-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[17px] bg-teal-tint text-teal-dark">
            <Icon name="doc" size={26} strokeWidth={1.9} />
          </span>
          <span className="block text-[15px] font-extrabold">Document PDF</span>
          <span className="mt-1 block text-[13px] leading-snug text-slate-light">
            Appuie pour lire le sujet en plein écran
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Image
        src={url}
        alt="Document"
        fill
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-contain"
      />
    </div>
  );
}
