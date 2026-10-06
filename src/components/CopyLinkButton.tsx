"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

/*
 * A link copied without its scheme is not a link. Pasted into WhatsApp — a
 * message, and above all a statut — "campusly-ucac.vercel.app/installer"
 * stays grey text that nobody can tap, so the person who received it reports
 * that the link does not open and the person who sent it cannot post it at
 * all. Normalising here, rather than at each call site, means no screen can
 * ever ship a dead one again.
 */
function lienAbsolu(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const { show } = useToast();
  const aCopier = lienAbsolu(url);
  // Shown without the scheme because that is how a person reads an address,
  // and copied with it because that is what a phone needs to open one.
  const affiche = aCopier.replace(/^https?:\/\//i, "");

  return (
    <div className="mt-4 flex h-[54px] items-center gap-2.5 rounded-2xl border border-line-4 bg-white py-0 pl-3.5 pr-2">
      <span className="flex-1 truncate text-[14px] text-ink-soft">{affiche}</span>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(aCopier);
            setCopied(true);
            show("Lien copié");
          } catch {
            show("Impossible de copier le lien", "warn");
          }
        }}
        className="press-scale flex h-10 flex-none items-center gap-1.5 rounded-xl bg-teal px-3.5 text-[13.5px] font-bold text-white"
      >
        <Icon name="copy" size={16} strokeWidth={2} />
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}
