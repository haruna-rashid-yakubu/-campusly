"use client";

import { Gated } from "@/components/Gated";
import { Icon } from "@/components/icons";
import { compter } from "@/lib/compteur";

export function WhatsAppContactButton({
  authed,
  whatsapp,
  citeId,
}: {
  authed: boolean;
  whatsapp: string;
  citeId: number;
}) {
  return (
    <Gated
      authed={authed}
      onAuthed={() => {
        // Counted before the window opens, never after: on a phone this line
        // is the last one to run before the page is backgrounded.
        compter({ type: "contact_bailleur", cible: "cite", cibleId: citeId });
        window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
      }}
    >
      {(onClick) => (
        <button
          onClick={onClick}
          className="press-scale mt-[18px] flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal text-[15.5px] font-bold text-white active:bg-teal-press"
        >
          <Icon name="chat" size={19} strokeWidth={1.9} />
          Contacter sur WhatsApp
        </button>
      )}
    </Gated>
  );
}
