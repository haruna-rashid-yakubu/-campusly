"use client";

import { useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

export function DownloadButton({
  fileUrl,
  onRecord,
  label = "Télécharger",
}: {
  fileUrl: string | null;
  onRecord?: () => Promise<void>;
  label?: string;
}) {
  const { show } = useToast();
  const [, startTransition] = useTransition();

  if (!fileUrl) {
    return (
      <button
        onClick={() => show("Fichier indisponible pour ce contenu de démonstration", "warn")}
        className="flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-surface text-[15.5px] font-bold text-slate-light"
      >
        <Icon name="down" size={19} strokeWidth={1.9} />
        {label}
      </button>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onRecord && startTransition(onRecord)}
      className="press-scale flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal text-[15.5px] font-bold text-white active:bg-teal-press"
    >
      <Icon name="down" size={19} strokeWidth={1.9} />
      {label}
    </a>
  );
}
