"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { Sheet } from "@/components/Sheet";

const FREE_DOWNLOADS = 3;
const COUNT_KEY = "campusly:downloads";
const SHARED_KEY = "campusly:shared";
const APP_URL = "https://campusly.app";

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

  const handleClick = (e: React.MouseEvent) => {
    if (getCount() >= FREE_DOWNLOADS && !hasShared()) {
      e.preventDefault();
      setGateOpen(true);
      return;
    }
    window.localStorage.setItem(COUNT_KEY, String(getCount() + 1));
    if (onRecord) startTransition(onRecord);
  };

  const handleShare = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent("Campusly — ton campus dans une appli : " + APP_URL)}`,
      "_blank"
    );
    window.localStorage.setItem(SHARED_KEY, "1");
    setGateOpen(false);
    show("Merci d'avoir partagé Campusly ! Retélécharge pour continuer.");
  };

  return (
    <>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="press-scale flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-teal text-[15.5px] font-bold text-white active:bg-teal-press"
      >
        <Icon name="down" size={19} strokeWidth={1.9} />
        {label}
      </a>

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
