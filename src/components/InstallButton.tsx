"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const { show } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") show("Campusly ajoutée à ton écran d'accueil");
        setDeferred(null);
      }}
      className="press-scale mt-4 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal text-[15.5px] font-bold text-white active:bg-teal-press"
    >
      <Icon name="down" size={19} strokeWidth={1.9} />
      Installer maintenant
    </button>
  );
}
