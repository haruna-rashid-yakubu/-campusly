"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

/*
 * The screen threw the error away: it took `error` and destructured only
 * `reset`, so "Un problème est survenu" was the whole of what anyone — the
 * person, or whoever they reported it to — ever had to go on.
 *
 * The details stay folded, because a stack is noise to a student and the
 * reassurance is what they need first. One tap opens what an admin can send
 * on: a client-side fault carries its real message here, and a server-side
 * one carries the digest that identifies it in the logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    console.error("Campusly:", error);
  }, [error]);

  const details = [
    error.message || "(message supprimé par le build de production)",
    error.digest ? `digest: ${error.digest}` : null,
    typeof window !== "undefined" ? `page: ${window.location.pathname}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-9 text-center">
      <Logo size={72} />
      <div className="mt-6 text-[22px] font-extrabold tracking-tight">Un problème est survenu</div>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-slate-light">
        Réessaie dans un instant. Si le problème persiste, reviens à l&rsquo;accueil.
      </p>
      <button
        onClick={reset}
        className="press-scale mt-6 flex h-[54px] items-center rounded-2xl bg-teal px-6 text-[15.5px] font-bold text-white active:bg-teal-press"
      >
        Réessayer
      </button>

      <button
        onClick={() => setOuvert((v) => !v)}
        className="mt-4 h-10 text-[13px] font-bold text-slate-light"
      >
        {ouvert ? "Masquer les détails" : "Détails techniques"}
      </button>

      {ouvert && (
        <div className="mt-1 w-full max-w-sm">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-[14px] border border-line bg-surface-2 p-3 text-left text-[12px] leading-snug text-ink-soft">
            {details}
          </pre>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(details);
                setCopie(true);
              } catch {
                /* la sélection à la main reste possible */
              }
            }}
            className="mt-2 h-10 w-full rounded-[13px] border-[1.5px] border-line-2 text-[13.5px] font-bold text-slate-light"
          >
            {copie ? "Copié" : "Copier pour le signaler"}
          </button>
        </div>
      )}
    </div>
  );
}
