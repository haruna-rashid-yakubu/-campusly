"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { InstallNudge } from "@/components/InstallNudge";
import { NotifNudge } from "@/components/NotifNudge";
import { SignInButton } from "@/components/SignInButton";
import { readPushStatus } from "@/lib/push-client";

const NOTIF_DISMISSED = "campusly:nudge-dismissed";
const INSTALL_DISMISSED = "campusly:install-dismissed";
const SIGNIN_DISMISSED = "campusly:signin-dismissed";
const PROFIL_DISMISSED = "campusly:profil-dismissed";
const SEMAINE = 7 * 24 * 60 * 60 * 1000;

type Choix = "notif" | "install" | "profil" | "connexion" | null;

function recent(cle: string) {
  try {
    return Date.now() - Number(localStorage.getItem(cle) ?? 0) < SEMAINE;
  } catch {
    return false;
  }
}

/*
 * Home asks for one thing at a time. It used to stack an install banner, a
 * notifications card and a second install card on the same screen — three
 * requests before the student had read anything, two of them for the same
 * thing.
 *
 * In order: the evening timetable (the most useful; on an iPhone in Safari it
 * is also what asks to install, since push needs the home screen there), then
 * the one-tap install where the browser offers it, then signing in. Each "plus
 * tard" holds for a week, and the next one only shows once the previous is
 * answered or snoozed.
 */
export function InvitationAccueil({ connecte, profilIncomplet = false }: { connecte: boolean; profilIncomplet?: boolean }) {
  const [choix, setChoix] = useState<Choix>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = () => setInstallable(true);
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const push = readPushStatus();
    const suivant: Choix =
      (push === "default" || push === "install-required") && !recent(NOTIF_DISMISSED)
        ? "notif"
        : installable && !recent(INSTALL_DISMISSED)
          ? "install"
          : profilIncomplet && !recent(PROFIL_DISMISSED)
            ? "profil"
            : !connecte && !recent(SIGNIN_DISMISSED)
            ? "connexion"
            : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoix(suivant);
  }, [installable, connecte, profilIncomplet]);

  if (choix === "notif") {
    return (
      <NotifNudge
        compact
        titre="Ton programme de demain, chaque soir"
        detail="À 20h, tes cours du lendemain avec les salles. Et un mot quand de nouvelles épreuves arrivent."
      />
    );
  }
  if (choix === "install") return <InstallNudge />;
  if (choix === "profil") {
    return (
      <div className="anim-fade mt-4 flex items-center gap-3 rounded-[20px] border border-teal-border bg-teal-tint-soft p-4">
        <Link href="/profil" className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
            <Icon name="chat" size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-extrabold">Complète ton profil</span>
            <span className="mt-0.5 block text-[13.5px] leading-snug text-slate">
              Ton prénom et ton WhatsApp, pour que les vendeurs te recontactent.
            </span>
          </span>
        </Link>
        <button
          onClick={() => {
            try {
              localStorage.setItem(PROFIL_DISMISSED, String(Date.now()));
            } catch {
              // Private mode: asked again next time.
            }
            setChoix(null);
          }}
          aria-label="Plus tard"
          className="press-scale grid h-11 w-11 flex-none place-items-center text-slate"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
    );
  }
  if (choix !== "connexion") return null;

  return (
    <div className="anim-fade mt-4 rounded-[20px] border border-teal-border bg-teal-tint-soft p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
          <Icon name="lock" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">Garde tout au même endroit</div>
          <p className="mt-0.5 text-[13.5px] leading-snug text-slate">
            Connecte-toi pour proposer des sujets et cumuler ta carte de fidélité.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <SignInButton className="press-scale flex h-[46px] flex-1 items-center justify-center rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press disabled:opacity-60" />
        <button
          onClick={() => {
            try {
              localStorage.setItem(SIGNIN_DISMISSED, String(Date.now()));
            } catch {
              // Private mode: asked again next time.
            }
            setChoix(null);
          }}
          className="press-scale flex h-[46px] items-center px-3.5 text-[14px] font-bold text-slate"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
