"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "campusly:install-dismissed";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/*
 * The one-tap install, offered where the app has just been useful rather than
 * on the way in.
 *
 * It exists only on Android: Chrome fires `beforeinstallprompt` when the app
 * is installable and not yet installed, which is both the permission to ask
 * and the answer to whether asking is worth anything. On an iPhone the event
 * never fires and this renders nothing — there, installing is a manual trip
 * through the share menu, and the honest moment to mention it is when someone
 * asks for notifications, which is where NotifNudge already says so.
 *
 * Refusing hides it for a week. Someone who said no does not need to be asked
 * again the next time they check their timetable.
 */
export function InstallNudge() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [cache, setCache] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    // Starts hidden so the first client render matches the server's, then the
    // snooze is read here because localStorage does not exist until now.
    try {
      const quand = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCache(Date.now() - quand < SNOOZE_MS);
    } catch {
      setCache(false);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (cache || !deferred) return null;

  const installer = async () => {
    await deferred.prompt();
    const choix = await deferred.userChoice;
    setDeferred(null);
    if (choix.outcome === "accepted") {
      show("Campusly est sur ton écran d'accueil");
    } else {
      try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      } catch {
        // Private mode: it will simply be offered again next time.
      }
    }
  };

  const plusTard = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ditto
    }
    setCache(true);
  };

  return (
    <div className="anim-fade mt-4 rounded-[20px] border border-teal-border bg-teal-tint-soft p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
          <Icon name="down" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">Garde Campusly à portée</div>
          <p className="mt-0.5 text-[13.5px] leading-snug text-slate">
            Ajoute-la à ton écran d&rsquo;accueil : elle s&rsquo;ouvre comme une vraie appli, sans
            passer par le navigateur.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={installer}
          className="press-scale h-[46px] flex-1 rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
        >
          Ajouter
        </button>
        <button onClick={plusTard} className="h-[46px] px-4 text-[14px] font-bold text-slate-light">
          Plus tard
        </button>
      </div>
    </div>
  );
}
