"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const { show } = useToast();

  return (
    <div className="mt-4 flex h-[54px] items-center gap-2.5 rounded-2xl border border-line-4 bg-white py-0 pl-3.5 pr-2">
      <span className="flex-1 truncate text-[14px] text-ink-soft">{url}</span>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
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
