"use client";

import { useState, useTransition } from "react";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { publishProgramme } from "@/lib/actions";

export function ProgrammePublishForm({
  classes,
  defaultClasse,
}: {
  classes: string[];
  defaultClasse: string;
}) {
  const [classe, setClasse] = useState(defaultClasse);
  const [weekLabel, setWeekLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const submit = () => {
    if (!file) return show("Ajoute une photo du programme", "warn");
    if (!weekLabel.trim()) return show("Précise la semaine, ex. Semaine du 21 au 26 sept.", "warn");
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      try {
        await publishProgramme(classe, weekLabel.trim(), fd);
        show(`Programme publié pour ${classe}`);
        setFile(null);
        setWeekLabel("");
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur lors de la publication", "warn");
      }
    });
  };

  return (
    <div>
      <div className="mb-1.5 text-[13px] font-bold text-ink-soft">Classe</div>
      <PickerButton
        title="Choisis la classe"
        value={classe}
        options={classes.map((c) => ({ label: c, value: c }))}
        onSelect={setClasse}
        trigger={(open) => (
          <button
            onClick={open}
            className="flex h-[52px] w-full items-center justify-between rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] font-bold active:border-teal"
          >
            {classe}
            <Icon name="chevD" size={18} strokeWidth={2} />
          </button>
        )}
      />

      <div className="mb-1.5 mt-4 text-[13px] font-bold text-ink-soft">Semaine</div>
      <input
        value={weekLabel}
        onChange={(e) => setWeekLabel(e.target.value)}
        placeholder="Semaine du 21 au 26 sept."
        className="h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] outline-none focus:border-teal"
      />

      <div className="mb-1.5 mt-[18px] text-[13px] font-bold text-ink-soft">Photo du programme</div>
      <label className="block w-full cursor-pointer rounded-[18px] border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft p-[26px] text-center">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-[15px] bg-teal-tint text-teal-dark">
          <Icon name="cam" size={22} />
        </span>
        <span className="block text-[14.5px] font-extrabold">
          {file ? `${file.name} · prêt` : "Prendre une photo"}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-slate-light">ou choisir dans la galerie</span>
      </label>

      <button
        disabled={pending}
        onClick={submit}
        className="press-scale mt-[18px] h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        {pending ? "Publication…" : `Publier pour ${classe}`}
      </button>
    </div>
  );
}
