"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/Sheet";
import { googleSignIn } from "@/lib/actions";

export function Gated({
  authed,
  onAuthed,
  children,
}: {
  authed: boolean;
  onAuthed: () => void;
  children: (onClick: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (authed) onAuthed();
    else setOpen(true);
  };

  return (
    <>
      {children(handleClick)}
      <Sheet open={open} onClose={() => setOpen(false)} title="Connecte-toi">
        <p className="mb-2 text-[14.5px] leading-relaxed text-slate">
          On demande ton compte Google uniquement pour savoir qui envoie. Rien n&rsquo;est publié sur ton
          compte.
        </p>
        <button
          disabled={pending}
          onClick={() => startTransition(() => googleSignIn())}
          className="press-scale mt-4 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-line-4 bg-white text-[15.5px] font-bold disabled:opacity-60 active:bg-surface-3"
        >
          <span className="text-[19px] font-extrabold">G</span>
          Continuer avec Google
        </button>
        <button
          onClick={() => setOpen(false)}
          className="mt-1 h-12 w-full border-0 bg-none text-[14.5px] font-bold text-slate-light"
        >
          Plus tard
        </button>
      </Sheet>
    </>
  );
}
