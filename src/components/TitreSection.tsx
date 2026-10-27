import Link from "next/link";
import type { ReactNode } from "react";

/*
 * The one style the home screen is built from. Every block opens on the same
 * title, and every card shares the same corners, hairline and shadow, so the
 * screen reads as one page rather than a pile of pieces made at different
 * times. Anything inside a card — an icon tile, a button — takes 14px corners.
 */
export const CARTE =
  "rounded-[20px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_24px_-14px_rgba(15,23,42,.18)]";

// clair: on a dark band (a season's night sky), the title turns light.
export function TitreSection({
  children,
  lien,
  clair = false,
}: {
  children: ReactNode;
  lien?: { href: string; label: string };
  clair?: boolean;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className={`text-[17px] font-extrabold tracking-tight ${clair ? "text-white" : ""}`}>{children}</h2>
      {lien && (
        <Link href={lien.href} className={`text-[13px] font-bold ${clair ? "text-[#fdba74]" : "text-teal-dark"}`}>
          {lien.label}
        </Link>
      )}
    </div>
  );
}
