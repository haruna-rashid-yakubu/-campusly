"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { SubjectFields, type SubjectFieldValues } from "@/components/admin/SubjectFields";
import { deleteSubject, updateSubject } from "@/lib/actions";

export function SubjectEditForm({
  subjectId,
  initial,
  facets,
  types,
}: {
  subjectId: number;
  initial: SubjectFieldValues;
  facets: Record<string, string[]>;
  types: readonly string[];
}) {
  const [values, setValues] = useState(initial);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  const save = () =>
    startTransition(async () => {
      try {
        await updateSubject(subjectId, values);
        show("Modifications enregistrées", "success");
        router.push("/admin?tab=publies");
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur", "warn");
      }
    });

  const remove = () =>
    startTransition(async () => {
      try {
        await deleteSubject(subjectId);
        show(`${initial.matiere} supprimé`, "warn");
        router.push("/admin?tab=publies");
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur", "warn");
      }
    });

  return (
    <>
      <div className="mb-3.5 mt-6 text-base font-extrabold tracking-tight">Informations</div>

      <SubjectFields values={values} onChange={setValues} facets={facets} types={types} />

      <button
        disabled={pending}
        onClick={save}
        className="press-scale mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        <Icon name="check" size={19} strokeWidth={2.3} />
        {pending ? "…" : "Enregistrer"}
      </button>

      <div className="mt-8 rounded-[18px] border-[1.5px] border-danger-border bg-danger-tint p-4">
        <div className="text-[14.5px] font-extrabold text-danger">Supprimer ce sujet</div>
        <p className="mt-1 text-[13px] leading-snug text-slate">
          Le sujet disparaît de l&rsquo;appli et son document est effacé. C&rsquo;est définitif.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex gap-2.5">
            <button
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
              className="h-[48px] flex-1 rounded-[13px] border-[1.5px] border-line-2 bg-white text-[14px] font-bold disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              disabled={pending}
              onClick={remove}
              className="press-scale h-[48px] flex-1 rounded-[13px] bg-danger text-[14px] font-bold text-white disabled:opacity-60"
            >
              Oui, supprimer
            </button>
          </div>
        ) : (
          <button
            disabled={pending}
            onClick={() => setConfirmingDelete(true)}
            className="press-scale mt-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-danger-border bg-white text-[14px] font-bold text-danger disabled:opacity-60"
          >
            <Icon name="x" size={17} strokeWidth={2.2} />
            Supprimer
          </button>
        )}
      </div>
    </>
  );
}
