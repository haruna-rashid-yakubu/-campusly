"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/icons";

export function OfflineOverlay() {
  // `navigator.onLine`'s initial reading is notoriously unreliable (some
  // browsers/networks misreport false on load, with no later `online` event
  // to correct it since no real transition occurred). Trust only the
  // `online`/`offline` events, which fire on genuine transitions.
  const [online, setOnline] = useState(true);
  const [viewingCache, setViewingCache] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setViewingCache(false);
      router.refresh();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [router]);

  if (online) return null;

  const retry = async () => {
    try {
      await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store" });
      setOnline(true);
      router.refresh();
    } catch {
      /* still offline */
    }
  };

  if (viewingCache) {
    return (
      <div
        className="fixed inset-x-3 z-[18] flex h-[38px] items-center gap-2 rounded-[13px] bg-ink px-3 text-[12.5px] font-semibold text-white anim-toast"
        style={{ top: "calc(10px + var(--safe-top))" }}
      >
        <Icon name="wifiOff" size={15} strokeWidth={2} />
        Hors ligne — contenu gardé sur ton téléphone
      </div>
    );
  }

  return (
    <div className="anim-fade fixed inset-0 z-30 flex flex-col items-center justify-center bg-white px-9 text-center">
      <span className="block w-[88px] opacity-90">
        <Logo size={88} />
      </span>
      <div className="mt-6 text-[22px] font-extrabold tracking-tight">Pas de connexion.</div>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-light">
        Réessaie quand le réseau revient. Tes dernières pages restent consultables.
      </p>
      <button
        onClick={retry}
        className="press-scale mt-6 flex h-[54px] items-center gap-2.5 rounded-2xl bg-teal px-6 text-[15.5px] font-bold text-white active:bg-teal-press"
      >
        <Icon name="retry" size={19} strokeWidth={2} />
        Réessayer
      </button>
      <button
        onClick={() => setViewingCache(true)}
        className="mt-1.5 h-11 px-4 text-[14.5px] font-bold text-teal-dark"
      >
        Voir le contenu hors ligne
      </button>
    </div>
  );
}
