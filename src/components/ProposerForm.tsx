"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { proposeSubject } from "@/lib/actions";
import { PROPOSER_FACETS, PROPOSER_LABELS } from "@/lib/constants";

const FIELDS = ["filiere", "niveau", "matiere", "annee", "type"] as const;

export function ProposerForm({
  defaultFiliere,
  defaultNiveau,
}: {
  defaultFiliere: string;
  defaultNiveau: string;
}) {
  const [values, setValues] = useState<Record<(typeof FIELDS)[number], string>>({
    filiere: PROPOSER_FACETS.filiere.includes(defaultFiliere) ? defaultFiliere : PROPOSER_FACETS.filiere[0],
    niveau: PROPOSER_FACETS.niveau.includes(defaultNiveau) ? defaultNiveau : PROPOSER_FACETS.niveau[0],
    matiere: PROPOSER_FACETS.matiere[0],
    annee: PROPOSER_FACETS.annee[0],
    type: PROPOSER_FACETS.type[0],
  });
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  const submit = () => {
    const fd = new FormData();
    FIELDS.forEach((f) => fd.set(f, values[f]));
    if (file) fd.set("file", file);
    startTransition(async () => {
      try {
        await proposeSubject(fd);
        setSent(true);
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur lors de l'envoi", "warn");
      }
    });
  };

  return (
    <>
      <div className="px-5 pb-10 pt-4">
        {FIELDS.map((f) => (
          <div key={f} className="mb-3.5">
            <div className="mb-1.5 text-[13px] font-bold text-ink-soft">{PROPOSER_LABELS[f]}</div>
            <PickerButton
              title={PROPOSER_LABELS[f]}
              value={values[f]}
              options={PROPOSER_FACETS[f].map((o) => ({ label: o, value: o }))}
              onSelect={(v) => setValues((s) => ({ ...s, [f]: v }))}
              trigger={(open) => (
                <button
                  onClick={open}
                  className="flex h-[52px] w-full items-center justify-between rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold active:border-teal"
                >
                  {values[f]}
                  <Icon name="chevD" size={18} strokeWidth={2} />
                </button>
              )}
            />
          </div>
        ))}

        <div className="mb-1.5 mt-[18px] text-[13px] font-bold text-ink-soft">Document</div>
        <label className="block w-full cursor-pointer rounded-[18px] border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft p-[26px] text-center">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-[15px] bg-teal-tint text-teal-dark">
            <Icon name="up" size={22} />
          </span>
          <span className="block text-[14.5px] font-extrabold">{file ? file.name : "Photo ou PDF"}</span>
          <span className="mt-0.5 block text-[12.5px] text-slate-light">10 Mo maximum · JPG, PNG ou PDF</span>
        </label>

        <div className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-slate-light">
          <span className="mt-0.5 flex-none text-teal-dark">
            <Icon name="shield" size={15} strokeWidth={1.9} />
          </span>
          Ton envoi est vérifié par l&rsquo;équipe avant publication. Ton nom n&rsquo;apparaît pas sur le
          sujet.
        </div>

        <button
          disabled={pending}
          onClick={submit}
          className="press-scale mt-5 h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white transition-transform disabled:opacity-60 active:bg-teal-press"
        >
          {pending ? "Envoi…" : "Envoyer"}
        </button>
      </div>

      {sent && (
        <div className="anim-fade fixed inset-0 z-30 grid place-items-center bg-ink/50 p-7">
          <div className="w-full max-w-sm rounded-[26px] bg-white p-7 text-center">
            <span className="mx-auto mb-4 grid h-[62px] w-[62px] place-items-center rounded-full bg-teal-tint text-teal-dark">
              <Icon name="check" size={28} strokeWidth={2.4} />
            </span>
            <div className="text-[19px] font-extrabold tracking-tight">Sujet envoyé</div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-slate">
              Ton sujet sera visible après validation par l&rsquo;équipe Campusly.
            </p>
            <button
              onClick={() => router.push("/sujets/mes-envois")}
              className="press-scale mt-5 h-[52px] w-full rounded-2xl bg-teal text-[15px] font-bold text-white active:bg-teal-press"
            >
              Voir mes envois
            </button>
            <button
              onClick={() => router.push("/sujets")}
              className="mt-0.5 h-[46px] w-full text-[14.5px] font-bold text-slate-light"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
