"use client";

import { useMemo, useState, useTransition } from "react";
import { PickerButton } from "@/components/PickerButton";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { saveProgramme, type CreneauInput } from "@/lib/actions";
import { JOURS, MOMENTS } from "@/lib/constants";

export type Cell = {
  matiere: string;
  enseignant: string;
  salle: string;
  seance: string;
  seances: string;
  cc: boolean;
};

const EMPTY: Cell = { matiere: "", enseignant: "", salle: "", seance: "", seances: "", cc: false };

/** "lundi-matin" — the 12 keys of the grid. */
const keyOf = (jour: number, moment: string) => `${jour}-${moment}`;

export function ProgrammeGridForm({
  classes,
  defaultClasse,
  semaine,
  semaineLabel,
  initial,
  initialWeekLabel,
  initialSalle,
  previous,
  matieres,
}: {
  classes: string[];
  defaultClasse: string;
  semaine: string;
  semaineLabel: string;
  initial: Record<string, Cell>;
  initialWeekLabel: string;
  initialSalle: string;
  previous: Record<string, Cell>;
  matieres: string[];
}) {
  const [classe, setClasse] = useState(defaultClasse);
  const [weekLabel, setWeekLabel] = useState(initialWeekLabel);
  const [salleDefaut, setSalleDefaut] = useState(initialSalle);
  const [cells, setCells] = useState<Record<string, Cell>>(initial);
  const [openDetails, setOpenDetails] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const filled = useMemo(
    () => Object.values(cells).filter((c) => c.matiere.trim()).length,
    [cells]
  );
  const hasPrevious = Object.keys(previous).length > 0;

  const setCell = (key: string, patch: Partial<Cell>) =>
    setCells((prev) => ({ ...prev, [key]: { ...(prev[key] ?? EMPTY), ...patch } }));

  const submit = () => {
    const payload: CreneauInput[] = [];
    for (const jour of JOURS.map((_, i) => i + 1)) {
      for (const moment of MOMENTS) {
        const c = cells[keyOf(jour, moment.id)];
        if (!c?.matiere.trim()) continue;
        payload.push({
          jour,
          moment: moment.id,
          matiere: c.matiere,
          enseignant: c.enseignant,
          salle: c.salle,
          seance: c.seance ? Number(c.seance) : null,
          seances: c.seances ? Number(c.seances) : null,
          cc: c.cc,
        });
      }
    }
    if (payload.length === 0 && !file) {
      return show("Remplis au moins une case, ou ajoute la photo", "warn");
    }

    const fd = new FormData();
    fd.set("classeLabel", classe);
    fd.set("semaine", semaine);
    fd.set("weekLabel", weekLabel.trim());
    fd.set("salleDefaut", salleDefaut.trim());
    fd.set("creneaux", JSON.stringify(payload));
    if (file) fd.set("file", file);

    startTransition(async () => {
      try {
        await saveProgramme(fd);
        show(`Programme enregistré pour ${classe}`);
        setFile(null);
      } catch (e) {
        show(e instanceof Error ? e.message : "Erreur à l'enregistrement", "warn");
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

      <div className="mt-4 flex gap-2.5">
        <div className="flex-1">
          <div className="mb-1.5 text-[13px] font-bold text-ink-soft">Libellé de la semaine</div>
          <input
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="Semaine 25"
            className="h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] outline-none focus:border-teal"
          />
        </div>
        <div className="w-[38%]">
          <div className="mb-1.5 text-[13px] font-bold text-ink-soft">Salle</div>
          <input
            value={salleDefaut}
            onChange={(e) => setSalleDefaut(e.target.value)}
            placeholder="Salle B"
            className="h-[52px] w-full rounded-2xl border-[1.5px] border-line-2 bg-white px-3.5 text-[15px] outline-none focus:border-teal"
          />
        </div>
      </div>
      <p className="mt-1.5 text-[12.5px] text-slate-light">{semaineLabel}</p>

      {hasPrevious && (
        <button
          onClick={() => setCells(previous)}
          className="press-scale mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-line-2 text-[13.5px] font-bold active:bg-surface-2"
        >
          <Icon name="cal" size={17} strokeWidth={2} />
          Reprendre la semaine dernière
        </button>
      )}

      <datalist id="matieres-connues">
        {matieres.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="mb-2 mt-6 flex items-baseline justify-between">
        <span className="text-base font-extrabold tracking-tight">La semaine</span>
        <span className="text-[12.5px] text-slate-light">{filled} / 12 cases</span>
      </div>

      {JOURS.map((jourLabel, i) => {
        const jour = i + 1;
        return (
          <div key={jourLabel} className="mb-3 overflow-hidden rounded-[18px] border border-line">
            <div className="bg-surface px-3.5 py-2 text-[13.5px] font-extrabold">{jourLabel}</div>
            {MOMENTS.map((moment) => {
              const key = keyOf(jour, moment.id);
              const cell = cells[key] ?? EMPTY;
              const open = openDetails === key;
              return (
                <div key={key} className="border-t border-line-3 px-3.5 py-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-light">
                      {moment.label} · {moment.heures}
                    </span>
                    <button
                      onClick={() => setOpenDetails(open ? null : key)}
                      className="text-[12px] font-bold text-teal-dark"
                    >
                      {open ? "Moins" : "Détails"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      list="matieres-connues"
                      value={cell.matiere}
                      onChange={(e) => setCell(key, { matiere: e.target.value })}
                      placeholder="Pas de cours"
                      className="h-[46px] min-w-0 flex-1 rounded-[13px] border-[1.5px] border-line-2 bg-white px-3 text-[14.5px] outline-none focus:border-teal"
                    />
                    {cell.matiere.trim() && (
                      <button
                        onClick={() => setCell(key, EMPTY)}
                        aria-label="Vider la case"
                        className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[13px] border-[1.5px] border-line-2 text-slate-light active:bg-surface-2"
                      >
                        <Icon name="x" size={17} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                  {open && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        value={cell.enseignant}
                        onChange={(e) => setCell(key, { enseignant: e.target.value })}
                        placeholder="Enseignant"
                        className="col-span-2 h-[44px] rounded-[13px] border-[1.5px] border-line-2 px-3 text-[14px] outline-none focus:border-teal"
                      />
                      <input
                        value={cell.salle}
                        onChange={(e) => setCell(key, { salle: e.target.value })}
                        placeholder={salleDefaut || "Salle"}
                        className="h-[44px] rounded-[13px] border-[1.5px] border-line-2 px-3 text-[14px] outline-none focus:border-teal"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          value={cell.seance}
                          onChange={(e) => setCell(key, { seance: e.target.value })}
                          inputMode="numeric"
                          placeholder="n°"
                          className="h-[44px] w-full min-w-0 rounded-[13px] border-[1.5px] border-line-2 px-3 text-[14px] outline-none focus:border-teal"
                        />
                        <span className="text-[13px] text-slate-light">/</span>
                        <input
                          value={cell.seances}
                          onChange={(e) => setCell(key, { seances: e.target.value })}
                          inputMode="numeric"
                          placeholder="sur"
                          className="h-[44px] w-full min-w-0 rounded-[13px] border-[1.5px] border-line-2 px-3 text-[14px] outline-none focus:border-teal"
                        />
                      </div>
                      <button
                        onClick={() => setCell(key, { cc: !cell.cc })}
                        className="col-span-2 flex h-[44px] items-center justify-center gap-2 rounded-[13px] border-[1.5px] text-[13.5px] font-bold"
                        style={{
                          borderColor: cell.cc ? "#0A7F77" : "#E2E8F0",
                          color: cell.cc ? "#0A7F77" : "#64748B",
                        }}
                      >
                        <Icon name={cell.cc ? "check" : "flag"} size={16} strokeWidth={2.2} />
                        {cell.cc ? "CC ici" : "Marquer un CC"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="mb-1.5 mt-5 text-[13px] font-bold text-ink-soft">
        Photo du programme <span className="font-medium text-slate-light">— facultatif</span>
      </div>
      <label className="block w-full cursor-pointer rounded-[18px] border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft p-[22px] text-center">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="block text-[14.5px] font-extrabold">
          {file ? `${file.name} · prêt` : "Ajouter la photo des valves"}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-slate-light">
          Elle reste affichée comme original
        </span>
      </label>

      <button
        disabled={pending}
        onClick={submit}
        className="press-scale mt-[18px] h-[54px] w-full rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        {pending ? "Enregistrement…" : `Enregistrer pour ${classe}`}
      </button>
    </div>
  );
}
