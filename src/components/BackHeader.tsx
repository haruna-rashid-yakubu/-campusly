"use client";

import { useRetour } from "@/components/Retour";
import { Icon } from "@/components/icons";

export function BackHeader({
  title,
  fallbackHref,
  right,
  border,
}: {
  title?: string;
  fallbackHref?: string;
  right?: React.ReactNode;
  border?: boolean;
}) {
  const retour = useRetour();
  return (
    <div
      className={
        "sticky top-0 z-10 flex items-center gap-1 bg-white px-3.5 pb-2" +
        (border ? " border-b border-line-3" : "")
      }
      style={{ paddingTop: "calc(20px + var(--safe-top))" }}
    >
      <button
        onClick={() => retour(fallbackHref)}
        className="press-scale grid h-11 w-11 flex-none place-items-center border-0 bg-none"
        aria-label="Retour"
      >
        <Icon name="back" size={22} strokeWidth={2} />
      </button>
      {/* Without a title, the space still pushes `right` to the right edge. */}
      <span className="flex-1 text-[17px] font-extrabold">{title}</span>
      {right}
    </div>
  );
}
