"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

/*
 * Copies a block of text rather than a URL — the caption that goes under a
 * statut, where the address stays tappable.
 *
 * An image cannot hold a link: text printed on a poster has to be typed out
 * by whoever reads it, and nobody types an address off a statut. The caption
 * is the only part of a photo statut WhatsApp renders as a real link, so the
 * poster carries the message and the caption carries the tap.
 */
export function CopierTexte({ texte, label }: { texte: string; label: string }) {
  const [copie, setCopie] = useState(false);
  const { show } = useToast();

  return (
    <div className="mt-3 rounded-[18px] border border-line bg-surface-2 p-3.5">
      <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-soft">{texte}</p>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texte);
            setCopie(true);
            show("Légende copiée");
          } catch {
            show("Impossible de copier — sélectionne le texte à la main", "warn");
          }
        }}
        className="press-scale mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
      >
        <Icon name="copy" size={17} strokeWidth={2} />
        {copie ? "Copiée" : label}
      </button>
    </div>
  );
}
