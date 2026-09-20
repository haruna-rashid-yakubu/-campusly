"use client";

import { useTransition } from "react";
import { BackHeader } from "@/components/BackHeader";
import { Icon } from "@/components/icons";
import { googleSignIn } from "@/lib/actions";

export function SignInRequired({ backHref, title }: { backHref: string; title?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader title={title} fallbackHref={backHref} border />
      <div className="px-7 pt-16 text-center">
        <span className="mx-auto mb-5 grid h-[74px] w-[74px] place-items-center rounded-[24px] bg-surface text-slate-light">
          <Icon name="lock" size={30} strokeWidth={1.6} />
        </span>
        <div className="text-lg font-extrabold">Connecte-toi pour continuer</div>
        <p className="mx-auto mt-2 max-w-xs text-[14.5px] leading-relaxed text-slate-light">
          On demande ton compte Google uniquement pour savoir qui envoie. Rien n&rsquo;est publié sur ton
          compte.
        </p>
        <button
          disabled={pending}
          onClick={() => startTransition(() => googleSignIn())}
          className="press-scale mx-auto mt-6 flex h-[54px] w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-line-4 bg-white text-[15.5px] font-bold disabled:opacity-60 active:bg-surface-3"
        >
          <span className="text-[19px] font-extrabold">G</span>
          Continuer avec Google
        </button>
      </div>
    </div>
  );
}
