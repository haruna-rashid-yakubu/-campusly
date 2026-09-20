"use client";

import { useTransition } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { moderateSubject } from "@/lib/actions";

export function ModerationCard({
  submission,
}: {
  submission: {
    id: number;
    matiere: string;
    filiere: string;
    niveau: string;
    annee: string;
    user: { name: string | null };
  };
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const act = (decision: "publie" | "refuse") => {
    startTransition(async () => {
      try {
        await moderateSubject(submission.id, decision);
        show(
          decision === "publie" ? `${submission.matiere} publié` : `${submission.matiere} refusé`,
          decision === "publie" ? "success" : "warn"
        );
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur", "warn");
      }
    });
  };

  return (
    <div className="anim-fade mb-3.5 overflow-hidden rounded-[20px] border border-line">
      <div className="flex gap-3 p-3.5">
        <span className="grid h-[76px] w-[62px] flex-none place-items-center rounded-[10px] bg-line-3 text-[10.5px] font-semibold text-slate-light">
          aperçu
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15.5px] font-extrabold">{submission.matiere}</div>
          <div className="mt-0.5 text-[12.5px] text-slate-light">
            {submission.filiere} · {submission.niveau} · {submission.annee}
          </div>
          <div className="mt-1.5 text-[12.5px] text-slate-light">
            Envoyé par {submission.user.name ?? "un étudiant"}
          </div>
        </div>
      </div>
      <div className="flex gap-2.5 px-3.5 pb-3.5">
        <button
          disabled={pending}
          onClick={() => act("publie")}
          className="press-scale flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[13px] bg-teal text-[14.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
        >
          <Icon name="check" size={18} strokeWidth={2.3} />
          Approuver
        </button>
        <button
          disabled={pending}
          onClick={() => act("refuse")}
          className="press-scale flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[13px] border-[1.5px] border-line-2 text-[14.5px] font-bold disabled:opacity-60 active:border-danger-border active:bg-danger-tint"
        >
          <Icon name="x" size={18} strokeWidth={2} />
          Refuser
        </button>
      </div>
    </div>
  );
}
