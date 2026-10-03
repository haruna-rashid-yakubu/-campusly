"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { enablePush, readPushStatus, type PushStatus } from "@/lib/push-client";

const DISMISSED_KEY = "campusly:nudge-dismissed";
const REPROMPT_MS = 7 * 24 * 60 * 60 * 1000;

/*
 * The offer, made where the thing it offers is already on screen — under the
 * week someone has just read, or on the confirmation of a paper they have just
 * sent. Never on arrival: that was the sheet that opened by itself, and asking
 * for an account before showing anything is what made it worth removing.
 *
 * It renders nothing once notifications are on, once they have been refused at
 * the browser level, or for a week after someone says "plus tard" — an offer
 * that keeps coming back stops being an offer.
 */
export function NotifNudge({
  titre,
  detail,
  compact = false,
}: {
  titre: string;
  detail: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [, startTransition] = useTransition();
  const { show } = useToast();

  useEffect(() => {
    const last = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    if (Date.now() - last < REPROMPT_MS) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(readPushStatus());
  }, []);

  if (status !== "default" && status !== "install-required") return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setStatus(null);
  };

  const activer = () =>
    startTransition(async () => {
      try {
        const next = await enablePush();
        setStatus(next === "active" ? null : next);
        if (next === "active") show("Notifications activées");
      } catch {
        show("Impossible d'activer les notifications", "warn");
      }
    });

  const besoinInstallation = status === "install-required";

  return (
    <div
      className={`anim-fade rounded-[20px] border border-teal-border bg-teal-tint-soft p-4 ${
        compact ? "mt-4 text-left" : "mb-3 mt-1"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
          <Icon name={besoinInstallation ? "down" : "bell"} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">
            {besoinInstallation ? "Ajoute Campusly à ton écran d'accueil" : titre}
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-slate">
            {besoinInstallation
              ? "Sur iPhone, les rappels n'arrivent qu'une fois l'appli installée. C'est deux touches."
              : detail}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2.5">
        {besoinInstallation ? (
          <Link
            href="/installer"
            className="press-scale flex h-[46px] flex-1 items-center justify-center rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
          >
            Voir comment
          </Link>
        ) : (
          <button
            onClick={activer}
            className="press-scale h-[46px] flex-1 rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
          >
            Activer
          </button>
        )}
        <button
          onClick={dismiss}
          className="h-[46px] px-4 text-[14px] font-bold text-slate-light"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
