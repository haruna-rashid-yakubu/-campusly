"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { marquerCommande } from "@/lib/actions";

/*
 * One order as the vendor sees it: the reference to find in WhatsApp, what to
 * put in the box, and two buttons. Built for a thumb at the end of a busy
 * Friday — big targets, no confirmation, and every tick can be undone.
 */
export function LigneCommandeVendeur({
  token,
  id,
  reference,
  quand,
  detail,
  total,
  cadeau,
  statut,
}: {
  token: string;
  id: number;
  reference: string;
  quand: string;
  detail: string;
  total: string;
  cadeau: string | null;
  statut: "livree" | "non_recue" | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const marquer = (s: "livree" | "non_recue" | null) =>
    startTransition(async () => {
      await marquerCommande(token, id, s);
      router.refresh();
    });

  return (
    <div
      className={`rounded-[18px] border p-3.5 ${
        statut === "livree"
          ? "border-teal-border bg-teal-tint-soft"
          : statut === "non_recue"
            ? "border-line bg-surface-3 opacity-70"
            : "border-line-4 bg-white"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[17px] font-extrabold tracking-tight">{reference}</span>
        <span className="text-[12.5px] text-slate-light">{quand}</span>
      </div>
      <div className="mt-1 text-[14px] leading-snug">{detail}</div>
      {total && <div className="mt-1 text-[13.5px] font-bold">{total}</div>}
      {cadeau && (
        <div className="mt-2 inline-block rounded-full bg-[#fde7ef] px-2.5 py-1 text-[12.5px] font-extrabold text-[#c2185b]">
          🎁 Fidélité : {cadeau}
        </div>
      )}

      {statut === null ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => marquer("livree")}
            disabled={pending}
            className="press-scale flex h-[48px] items-center justify-center gap-1.5 rounded-[14px] bg-teal text-[14.5px] font-bold text-white disabled:opacity-60"
          >
            <Icon name="check" size={18} strokeWidth={2.4} />
            Livrée
          </button>
          <button
            onClick={() => marquer("non_recue")}
            disabled={pending}
            className="press-scale flex h-[48px] items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-line-4 text-[14px] font-bold text-slate disabled:opacity-60"
          >
            <Icon name="x" size={17} strokeWidth={2.2} />
            Pas reçue
          </button>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center justify-between">
          <span className={`text-[13px] font-extrabold ${statut === "livree" ? "text-teal-dark" : "text-slate-light"}`}>
            {statut === "livree" ? "✓ Livrée" : "Pas reçue sur WhatsApp"}
          </span>
          <button
            onClick={() => marquer(null)}
            disabled={pending}
            className="text-[12.5px] font-bold text-slate-light underline underline-offset-2 disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
