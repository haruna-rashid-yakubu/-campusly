"use client";

import { Gated } from "@/components/Gated";
import { Icon } from "@/components/icons";

export function WhatsAppContactButton({ authed, whatsapp }: { authed: boolean; whatsapp: string }) {
  return (
    <Gated authed={authed} onAuthed={() => window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}`, "_blank")}>
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
