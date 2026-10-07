"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { demanderDocument } from "@/lib/actions";

/*
 * Asks the sender to send their paper again, from the screen where the gap is
 * visible. Refusing the submission is the other answer, and it loses the
 * paper; this one goes after it.
 *
 * The toast says how many devices were reached rather than "demandé", because
 * a student who never switched notifications on has none — and an admin who
 * believes the message went out would wait for a reply nobody was asked for.
 */
export function DemanderDocument({ submissionId }: { submissionId: number }) {
  const [envoye, setEnvoye] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const demander = () =>
    startTransition(async () => {
      const r = await demanderDocument(submissionId);
      if (!r.ok) {
        show(r.message, "warn");
        return;
      }
      setEnvoye(true);
      show(
        r.appareils > 0
          ? `Demande envoyée sur ${r.appareils} appareil${r.appareils > 1 ? "s" : ""}`
          : "Aucun appareil joignable — cet étudiant n'a pas activé les notifications",
        r.appareils > 0 ? "success" : "warn"
      );
    });

  if (envoye) {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-bold text-teal-dark">
        <Icon name="check" size={16} strokeWidth={2.4} />
        Demande envoyée
      </div>
    );
  }

  return (
    <button
      onClick={demander}
      disabled={pending}
      className="press-scale mt-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-line-4 bg-white text-[14.5px] font-bold disabled:opacity-60 active:bg-surface-2"
    >
      <Icon name="chat" size={18} strokeWidth={1.9} />
      {pending ? "Envoi…" : "Demander à l'étudiant de renvoyer"}
    </button>
  );
}
