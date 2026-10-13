"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { basculerRupture, basculerVendeurActif } from "@/lib/actions";

/*
 * Opening a shop is the one switch here that students see, so it takes the
 * same two taps as an announcement. Closing it again is immediate: hiding a
 * shop that has a problem should never wait on a confirmation.
 */
export function OuvertureVendeur({ id, nom, actif }: { id: number; nom: string; actif: boolean }) {
  const [confirme, setConfirme] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();

  const basculer = (valeur: boolean) =>
    startTransition(async () => {
      await basculerVendeurActif(id, valeur);
      show(valeur ? `${nom} est ouvert aux étudiants` : `${nom} est masqué`, "success");
      setConfirme(false);
      router.refresh();
    });

  if (actif) {
    return (
      <button
        onClick={() => basculer(false)}
        disabled={pending}
        className="press-scale mt-3 flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-line-4 text-[14px] font-bold disabled:opacity-60"
      >
        <Icon name="lock" size={16} />
        {pending ? "…" : "Masquer aux étudiants"}
      </button>
    );
  }
  return (
    <button
      onClick={() => (confirme ? basculer(true) : setConfirme(true))}
      disabled={pending}
      className={`press-scale mt-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-bold disabled:opacity-60 ${
        confirme ? "bg-warn-tint text-warn-ink" : "bg-teal text-white"
      }`}
    >
      <Icon name={confirme ? "warn" : "check"} size={17} strokeWidth={2.2} />
      {pending ? "…" : confirme ? "Confirmer — visible par tous les étudiants" : "Ouvrir aux étudiants"}
    </button>
  );
}

export function RuptureToggle({ id, nom, enRupture }: { id: number; nom: string; enRupture: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await basculerRupture(id, !enRupture);
          router.refresh();
        })
      }
      disabled={pending}
      aria-label={enRupture ? `Remettre ${nom} en vente` : `Mettre ${nom} en rupture`}
      className={`h-[32px] flex-none rounded-full px-3 text-[12px] font-bold disabled:opacity-60 ${
        enRupture ? "bg-warn-tint text-warn-ink" : "bg-teal-tint text-teal-active"
      }`}
    >
      {pending ? "…" : enRupture ? "En rupture" : "Disponible"}
    </button>
  );
}
