"use client";

import { useTransition } from "react";
import { GoogleLogo, GoogleLogoPastille } from "@/components/GoogleLogo";
import { googleSignIn } from "@/lib/actions";

/*
 * The discreet counterpart to SignOutButton. It replaces a sheet that opened
 * by itself 1.2s after any page load: a link shared on WhatsApp opened onto a
 * request for a Google account before the person had seen a single paper.
 * Nothing on the app requires an account to browse, so signing in is offered
 * here and demanded only where it is genuinely needed — reading a Sujet's
 * content (lib/acces), proposing a paper, or messaging a cité.
 */
export function SignInButton({
  className,
}: {
  // Given for a full-size button (the G then sits in a white disc); omitted for the small text link.
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => googleSignIn(window.location.pathname + window.location.search))}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-dark underline-offset-2 active:underline disabled:opacity-60"
      }
    >
      {className ? (
        <span className="flex items-center gap-2.5">
          <GoogleLogoPastille />
          Se connecter avec Google
        </span>
      ) : (
        <>
          <GoogleLogo size={15} />
          Se connecter
        </>
      )}
    </button>
  );
}
