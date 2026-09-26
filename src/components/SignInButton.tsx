"use client";

import { useTransition } from "react";
import { googleSignIn } from "@/lib/actions";

/*
 * The discreet counterpart to SignOutButton. It replaces a sheet that opened
 * by itself 1.2s after any page load: a link shared on WhatsApp opened onto a
 * request for a Google account before the person had seen a single paper.
 * Nothing on the app requires an account to browse or even to download, so
 * signing in is offered here and demanded only where it is genuinely needed —
 * proposing a paper, or messaging a cité.
 */
export function SignInButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => googleSignIn())}
      className="text-[13px] font-bold text-teal-dark underline-offset-2 active:underline disabled:opacity-60"
    >
      Se connecter
    </button>
  );
}
