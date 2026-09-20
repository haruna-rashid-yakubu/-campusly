"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/Sheet";
import { Icon } from "@/components/icons";
import { googleSignIn } from "@/lib/actions";

const LAST_SHOWN_KEY = "campusly:login-prompt-last";
const REPROMPT_MS = 3 * 24 * 60 * 60 * 1000; // show again every few days at most
const SHOW_DELAY_MS = 1200;

export function LoginPromptSheet({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (signedIn) return;
    const last = Number(window.localStorage.getItem(LAST_SHOWN_KEY) ?? 0);
    if (Date.now() - last < REPROMPT_MS) return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [signedIn]);

  if (signedIn) return null;

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Connecte-toi à Campusly">
      <div className="pb-1 text-center">
        <span className="mx-auto mb-3 grid h-[62px] w-[62px] place-items-center rounded-[20px] bg-teal-tint text-teal-dark">
          <Icon name="cap" size={28} strokeWidth={1.6} />
        </span>
        <p className="mx-auto max-w-xs text-[14px] leading-relaxed text-slate-light">
          Retrouve tes envois, reçois des notifications et propose des sujets — connecte-toi avec ton
          compte Google.
        </p>
        <button
          disabled={pending}
          onClick={() => startTransition(() => googleSignIn())}
          className="press-scale mx-auto mt-5 flex h-[54px] w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-line-4 bg-white text-[15.5px] font-bold disabled:opacity-60 active:bg-surface-3"
        >
          <span className="text-[19px] font-extrabold">G</span>
          Continuer avec Google
        </button>
        <button
          onClick={() => setOpen(false)}
          className="mx-auto mt-2.5 h-11 px-4 text-[14px] font-bold text-slate-light"
        >
          Peut-être plus tard
        </button>
      </div>
    </Sheet>
  );
}
