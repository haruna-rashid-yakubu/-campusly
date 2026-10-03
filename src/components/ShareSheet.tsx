"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { APP_DOMAIN, APP_URL } from "@/lib/constants";

export function ShareSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();

  const options = [
    {
      label: "WhatsApp",
      run: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent("Campusly — ton campus dans une appli : " + APP_URL)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      label: "Copier le lien",
      run: async () => {
        try {
          await navigator.clipboard.writeText(APP_URL);
          show("Lien copié");
        } catch {
          show("Impossible de copier le lien", "warn");
        }
      },
    },
    {
      label: "Plus d'options",
      run: async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: "Campusly", url: APP_URL });
          } catch {
            /* cancelled */
          }
        } else {
          show("Partage ouvert · Plus d'options");
        }
      },
    },
  ];

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
            onClick={() => {
              setOpen(false);
              o.run();
            }}
            className="flex min-h-[54px] w-full items-center border-0 border-b border-line-3 bg-transparent px-1 text-left text-[15.5px] font-medium active:bg-surface-2"
          >
            {o.label}
          </button>
        ))}
      </Sheet>
    </>
  );
}
