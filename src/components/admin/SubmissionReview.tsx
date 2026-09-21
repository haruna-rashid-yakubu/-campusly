"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { SubjectFields, type SubjectFieldValues } from "@/components/admin/SubjectFields";
import { moderateSubject } from "@/lib/actions";

export function SubmissionReview({
  submissionId,
  initial,
  facets,
  types,
}: {
  submissionId: number;
  initial: SubjectFieldValues;
  facets: Record<string, string[]>;
  types: readonly string[];
}) {
  const [values, setValues] = useState(initial);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  const act = (decision: "publie" | "refuse") => {
    if (decision === "publie" && !values.matiere.trim()) {
      show("La matière ne peut pas être vide.", "warn");
      return;
    }
    startTransition(async () => {
      try {
        await moderateSubject(submissionId, decision, note.trim() || undefined, values);
        show(
          decision === "publie" ? `${values.matiere} publié` : "Envoi refusé",
          decision === "publie" ? "success" : "warn"
        );
        router.push("/admin?tab=sujets");
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur", "warn");
      }
    });
  };

  return (
    <>
      <div className="mb-1 mt-6 text-base font-extrabold tracking-tight">
        Informations à publier
      </div>
      <p className="mb-3.5 text-[13px] leading-snug text-slate-light">
        Corrige ce que l&rsquo;étudiant a saisi si besoin — c&rsquo;est cette version qui sera
        visible.
      </p>

      <SubjectFields values={values} onChange={setValues} facets={facets} types={types} />

      {rejecting && (
        <div className="mt-3.5">
          <label
            htmlFor="refus-note"
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            Motif du refus
          </label>
          <textarea
            id="refus-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Photo illisible — renvoie-la mieux cadrée."
            className="w-full rounded-2xl border-[1.5px] border-line-2 bg-white p-3.5 text-[15px] outline-none focus:border-teal"
          />
          <p className="mt-1.5 text-[12.5px] leading-snug text-slate-light">
            L&rsquo;étudiant reçoit ce message dans sa notification.
          </p>
        </div>
      )}

      <button
        disabled={pending}
        onClick={() => act("publie")}
        className="press-scale mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        <Icon name="check" size={19} strokeWidth={2.3} />
        {pending ? "…" : "Publier ce sujet"}
      </button>

      {rejecting ? (
        <div className="mt-2.5 flex gap-2.5">
          <button
            disabled={pending}
            onClick={() => setRejecting(false)}
            className="h-[50px] flex-1 rounded-2xl border-[1.5px] border-line-2 text-[14.5px] font-bold disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            disabled={pending}
            onClick={() => act("refuse")}
            className="press-scale h-[50px] flex-1 rounded-2xl bg-danger text-[14.5px] font-bold text-white disabled:opacity-60"
          >
            Confirmer le refus
          </button>
        </div>
      ) : (
        <button
          disabled={pending}
          onClick={() => setRejecting(true)}
          className="mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold text-slate-light disabled:opacity-60"
        >
          <Icon name="x" size={18} strokeWidth={2} />
          Refuser cet envoi
        </button>
      )}
    </>
  );
}
