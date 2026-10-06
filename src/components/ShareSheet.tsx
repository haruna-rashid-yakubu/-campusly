"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { APP_DOMAIN, APP_URL } from "@/lib/constants";

const TEXTE = "Campusly — ton campus dans une appli : ";

export function ShareSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Read after mount: navigator does not exist during the server render, and
  // assuming either way would make the first client render disagree with it.
  const [partageSysteme, setPartageSysteme] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    setPartageSysteme(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      show("Lien copié");
    } catch {
      show("Impossible de copier le lien", "warn");
    }
  };

  /*
   * The order here is the whole point. A wa.me link can only ever open a
   * one-to-one conversation — there is no address that posts to WhatsApp
   * Statut, and no website can reach it. The phone's own share sheet is the
   * only route that lists Statut as a destination, so it goes first and says
   * so; the WhatsApp entry below it is honestly labelled as a conversation.
   *
   * The sheet used to offer "Plus d'options" last, and when the browser had
   * no navigator.share it showed "Partage ouvert" and opened nothing at all —
   * a button that reported success and did nothing.
   */
  const options: { label: string; aide?: string; run: () => void }[] = [];

  if (partageSysteme) {
    options.push({
      label: "Partager…",
      aide: "Pour un statut WhatsApp, choisis WhatsApp puis « Statut »",
      run: () => {
        // Called before closing the sheet: iOS only honours navigator.share
        // while the tap that triggered it is still being handled.
        navigator.share({ title: "Campusly", text: TEXTE, url: APP_URL }).catch(() => {
          /* annulé par la personne */
        });
        setOpen(false);
      },
    });
  }

  options.push(
    {
      label: "Envoyer dans une conversation",
      aide: "WhatsApp — ouvre la liste de tes contacts",
      run: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(TEXTE + APP_URL)}`,
          "_blank",
          "noopener,noreferrer"
        );
        setOpen(false);
      },
    },
    {
      label: "Copier le lien",
      aide: partageSysteme ? undefined : "Puis colle-le dans ton statut WhatsApp",
      run: () => {
        copier();
        setOpen(false);
      },
    }
  );

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ display: "contents" }}>
        {children}
      </span>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Partager Campusly"
        subtitle={`${APP_DOMAIN} — ton campus dans une appli.`}
      >
        {options.map((o) => (
          <button
            key={o.label}
            onClick={o.run}
            className="flex min-h-[54px] w-full flex-col items-start justify-center border-0 border-b border-line-3 bg-transparent px-1 py-2.5 text-left active:bg-surface-2"
          >
            <span className="text-[15.5px] font-medium">{o.label}</span>
            {o.aide && (
              <span className="mt-0.5 text-[12.5px] leading-snug text-slate-light">{o.aide}</span>
            )}
          </button>
        ))}
      </Sheet>
    </>
  );
}
