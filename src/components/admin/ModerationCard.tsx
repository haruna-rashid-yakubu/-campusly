"use client";

import Link from "next/link";
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
    type: string;
    fileUrl: string | null;
    createdAt: Date;
    user: { name: string | null };
  };
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  // The quick approve keeps the student's metadata as-is. Anything that needs
  // a correction — or a look at the document first — goes through "Relire".
  const approve = () => {
    startTransition(async () => {
      try {
        await moderateSubject(submission.id, "publie");
        show(`${submission.matiere} publié`, "success");
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur", "warn");
      }
    });
  };

  return (
    <div className="anim-fade mb-3.5 overflow-hidden rounded-[20px] border border-line">
      <Link
        href={`/admin/envois/${submission.id}`}
        prefetch={false}
        className="flex gap-3 p-3.5 active:bg-surface-3"
      >
        <span className="grid h-[76px] w-[62px] flex-none place-items-center rounded-[10px] bg-surface text-teal-active">
          <Icon name={submission.fileUrl ? "doc" : "warn"} size={24} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-extrabold">{submission.matiere}</span>
          <span className="mt-0.5 block text-[12.5px] text-slate-light">
            {submission.filiere} · {submission.niveau} · {submission.annee} · {submission.type}
          </span>
          <span className="mt-1.5 block text-[12.5px] text-slate-light">
            Par {submission.user.name ?? "un étudiant"} ·{" "}
            {submission.createdAt.toLocaleDateString("fr-FR")}
          </span>
        </span>
        <Icon name="right" size={18} className="flex-none self-center text-slate-light" />
      </Link>
      <div className="flex gap-2.5 px-3.5 pb-3.5">
        <Link
          href={`/admin/envois/${submission.id}`}
          prefetch={false}
          className="press-scale flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press"
        >
          <Icon name="search" size={18} strokeWidth={2.2} />
          Relire
        </Link>
        <button
          disabled={pending}
          onClick={approve}
          className="press-scale flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[13px] border-[1.5px] border-line-2 text-[14.5px] font-bold disabled:opacity-60 active:border-teal active:bg-teal-tint-soft"
        >
          <Icon name="check" size={18} strokeWidth={2.3} />
          Publier
        </button>
      </div>
    </div>
  );
}
