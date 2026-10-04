"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { Sheet } from "@/components/Sheet";
import { downloadFile } from "@/lib/download";
import { APP_URL } from "@/lib/constants";

const FREE_DOWNLOADS = 3;
// Old key names, kept deliberately — see the note in lib/constants.
const COUNT_KEY = "campusly:downloads";
const SHARED_KEY = "campusly:shared";

function getCount() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(COUNT_KEY) ?? 0);
}

function hasShared() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SHARED_KEY) === "1";
}

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
  const [gateOpen, setGateOpen] = useState(false);

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

  /*
   * Stays synchronous on purpose: Safari only honours a download while the
   * tap that asked for it is still live, and any await spends it. The
   * bookkeeping happens after the click for the same reason.
   */
  const runDownload = () => {
    try {
      downloadFile(fileUrl);
      window.localStorage.setItem(COUNT_KEY, String(getCount() + 1));
      if (onRecord) startTransition(onRecord);
    } catch {
      show("Téléchargement impossible", "warn");
    }
  };

  const handleClick = () => {
    if (getCount() >= FREE_DOWNLOADS && !hasShared()) {
      setGateOpen(true);
      return;
    }
    runDownload();
  };

  const handleShare = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent("Campusly — ton campus dans une appli : " + APP_URL)}`,
      "_blank",
      "noopener,noreferrer"
    );
    window.localStorage.setItem(SHARED_KEY, "1");
    setGateOpen(false);
    show("Merci d'avoir partagé Campusly ! Retélécharge pour continuer.");
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="press-scale flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal text-[15.5px] font-bold text-white active:bg-teal-press"
      >
        <Icon name="down" size={19} strokeWidth={1.9} />
        {label}
      </button>

      <Sheet
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        title="Continue à télécharger"
        subtitle="Tu as atteint la limite de téléchargements gratuits. Partage Campusly avec tes camarades pour débloquer les téléchargements illimités."
      >
        <button
          onClick={handleShare}
          className="press-scale mt-1 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal text-[15px] font-bold text-white active:bg-teal-press"
        >
          <Icon name="share" size={18} strokeWidth={1.9} />
          Partager Campusly
        </button>
      </Sheet>
    </>
  );
}
