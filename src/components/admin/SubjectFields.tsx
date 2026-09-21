"use client";

import { useId } from "react";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";

export type SubjectFieldValues = {
  matiere: string;
  filiere: string;
  niveau: string;
  annee: string;
  type: string;
  enseignant: string;
  corrige: boolean;
};

const TEXT_FIELDS = [
  { key: "matiere", label: "Matière", placeholder: "Macroeconomics", facet: "matiere" },
  { key: "filiere", label: "Filière", placeholder: "BME", facet: "filiere" },
  { key: "niveau", label: "Niveau", placeholder: "L2", facet: "niveau" },
  { key: "annee", label: "Année", placeholder: "2024", facet: "annee" },
  { key: "enseignant", label: "Enseignant", placeholder: "Dr. NOUMO FOKO", facet: "enseignant" },
] as const;

const INPUT_CLASS =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold text-ink outline-none focus:border-teal";

/**
 * Free text with a datalist rather than a picker: the admin has to be able to
 * enter a matière or a lecturer the bank has never seen, while still getting
 * the existing spellings as suggestions so "Dr Loumngam" doesn't silently
 * become a second lecturer next to "Dr. Loumngam".
 */
export function SubjectFields({
  values,
  onChange,
  facets,
  types,
}: {
  values: SubjectFieldValues;
  onChange: (next: SubjectFieldValues) => void;
  facets: Record<string, string[]>;
  types: readonly string[];
}) {
  const listId = useId();
  const set = <K extends keyof SubjectFieldValues>(key: K, value: SubjectFieldValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <>
      {TEXT_FIELDS.map((f) => (
        <div key={f.key} className="mb-3.5">
          <label
            htmlFor={`${listId}-${f.key}`}
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            {f.label}
            {f.key === "enseignant" && (
              <span className="font-semibold text-slate-light"> · facultatif</span>
            )}
          </label>
          <input
            id={`${listId}-${f.key}`}
            value={values[f.key]}
            list={`${listId}-${f.key}-options`}
            placeholder={f.placeholder}
            onChange={(e) => set(f.key, e.target.value)}
            className={INPUT_CLASS}
          />
          <datalist id={`${listId}-${f.key}-options`}>
            {(facets[f.facet] ?? []).map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
      ))}

      <div className="mb-3.5">
        <div className="mb-1.5 text-[13px] font-bold text-ink-soft">Type d&rsquo;épreuve</div>
        <PickerButton
          title="Type d'épreuve"
          value={values.type}
          options={types.map((t) => ({ label: t, value: t }))}
          onSelect={(v) => set("type", v)}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="flex h-[52px] w-full items-center justify-between rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-semibold active:border-teal"
            >
              {values.type}
              <Icon name="chevD" size={18} strokeWidth={2} />
            </button>
          )}
        />
      </div>

      <button
        type="button"
        onClick={() => set("corrige", !values.corrige)}
        aria-pressed={values.corrige}
        className="mb-1 flex h-[52px] w-full items-center gap-3 rounded-2xl border-[1.5px] border-line-2 px-3.5 text-left active:border-teal"
      >
        <span
          className={`grid h-6 w-6 flex-none place-items-center rounded-[7px] border-[1.5px] ${
            values.corrige ? "border-teal bg-teal text-white" : "border-line-2 text-transparent"
          }`}
        >
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
        <span className="text-[15px] font-semibold">Corrigé joint au document</span>
      </button>
    </>
  );
}
