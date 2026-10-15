"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { basculerRupture, basculerVendeurActif, regenererLienVendeur, supprimerCommande } from "@/lib/actions";

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

/* Two taps, like opening a shop: a deleted order does not come back. */
export function SupprimerCommande({ id, reference }: { id: number; reference: string }) {
  const [confirme, setConfirme] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();
  return (
    <button
      onClick={() =>
        confirme
          ? startTransition(async () => {
              await supprimerCommande(id);
              show(`${reference} supprimée`, "success");
              router.refresh();
            })
          : setConfirme(true)
      }
      disabled={pending}
      className={`press-scale h-[30px] flex-none rounded-full px-3 text-[12px] font-bold disabled:opacity-60 ${
        confirme ? "bg-[#fde8e7] text-[#b4231f]" : "border-[1.5px] border-line-4 text-slate"
      }`}
    >
      {pending ? "…" : confirme ? "Confirmer la suppression" : "Supprimer"}
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

/*
 * The vendor's private link, ready to paste into WhatsApp. Regenerating it
 * cuts off the old one at once — for a link that leaked, or a vendor who
 * changed phone hands.
 */
export function LienVendeur({ vendeurId, token, nom }: { vendeurId: number; token: string; nom: string }) {
  const [confirme, setConfirme] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();
  const chemin = `/vendeur/${token}`;

  const copier = async () => {
    const url = `${window.location.origin}${chemin}`;
    const texte = `Ton espace commandes Campusly : ${url}\nAprès chaque livraison, touche « Livrée » : c'est ce qui remplit la carte fidélité des étudiants. Garde ce lien pour toi.`;
    try {
      await navigator.clipboard.writeText(texte);
      show("Lien copié, colle-le dans WhatsApp", "success");
    } catch {
      show(url, "success");
    }
  };

  return (
    <div className="mt-4 rounded-[14px] bg-surface-2 p-3">
      <div className="text-[13px] font-bold text-ink-soft">Lien de {nom} pour confirmer les livraisons</div>
      <div className="mt-1 break-all text-[12px] text-slate-light">{chemin}</div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={copier}
          className="press-scale h-[40px] flex-1 rounded-[12px] bg-teal text-[13.5px] font-bold text-white"
        >
          Copier le lien et le message
        </button>
        <a
          href={chemin}
          className="press-scale grid h-[40px] place-items-center rounded-[12px] border-[1.5px] border-line-4 bg-white px-3 text-[13px] font-bold"
        >
          Ouvrir
        </a>
      </div>
      <button
        onClick={() =>
          confirme
            ? startTransition(async () => {
                await regenererLienVendeur(vendeurId);
                setConfirme(false);
                show("Nouveau lien créé, l'ancien ne marche plus", "success");
                router.refresh();
              })
            : setConfirme(true)
        }
        disabled={pending}
        className="mt-2 text-[12px] font-bold text-slate-light underline underline-offset-2 disabled:opacity-60"
      >
        {confirme ? "Confirmer : l'ancien lien cessera de marcher" : "Changer le lien"}
      </button>
    </div>
  );
}

/* The month's statement, ready to paste in the vendor's WhatsApp. */
export function CopierReleve({ texte }: { texte: string }) {
  const { show } = useToast();
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      show("Relevé copié, colle-le dans WhatsApp", "success");
    } catch {
      show("Copie impossible sur ce navigateur", "warn");
    }
  };
  return (
    <button
      onClick={copier}
      className="press-scale mt-2 h-[40px] w-full rounded-[12px] bg-teal text-[13.5px] font-bold text-white"
    >
      Copier le relevé pour WhatsApp
    </button>
  );
}
