import { Icon } from "@/components/icons";
import { JOURS, MOMENTS } from "@/lib/constants";

type Creneau = {
  jour: number;
  moment: string;
  matiere: string;
  enseignant: string | null;
  salle: string | null;
  seance: number | null;
  seances: number | null;
  cc: boolean;
};

/*
 * The 12 cells, read-only. An empty block is shown rather than skipped: "pas
 * de cours cet après-midi" is the single most useful line on the page for
 * someone deciding whether to make the trip.
 */
export function ProgrammeGrid({
  creneaux,
  salleDefaut,
}: {
  creneaux: Creneau[];
  salleDefaut: string | null;
}) {
  const at = (jour: number, moment: string) =>
    creneaux.find((c) => c.jour === jour && c.moment === moment);

  // A day with nothing at all is dropped: Saturday is usually free, and six
  // empty rows would push the real week off the screen.
  const jours = JOURS.map((label, i) => ({ label, jour: i + 1 })).filter(
    ({ jour }) => MOMENTS.some((m) => at(jour, m.id))
  );

  if (jours.length === 0) return null;

  return (
    <div>
      {jours.map(({ label, jour }) => (
        <div key={label} className="mb-3 overflow-hidden rounded-[20px] border border-line">
          <div className="bg-surface px-4 py-2 text-[13.5px] font-extrabold">{label}</div>
          {MOMENTS.map((moment) => {
            const c = at(jour, moment.id);
            return (
              <div key={moment.id} className="border-t border-line-3 px-4 py-3">
                <div className="text-[12px] font-bold uppercase tracking-wide text-slate-light">
                  {moment.label} · {moment.heures}
                </div>
                {c ? (
                  <>
                    <div className="mt-1 text-[15.5px] font-extrabold leading-snug">
                      {c.matiere}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-slate-light">
                      {c.enseignant && <span>{c.enseignant}</span>}
                      <span className="font-semibold text-ink-soft">
                        {c.salle ?? salleDefaut ?? ""}
                      </span>
                      {c.seance && c.seances && (
                        <span>
                          séance {c.seance}/{c.seances}
                        </span>
                      )}
                    </div>
                    {c.cc && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-danger-tint px-2.5 py-1 text-[12px] font-extrabold text-danger">
                        <Icon name="flag" size={14} strokeWidth={2.3} />
                        Contrôle continu
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-1 text-[14.5px] font-bold text-slate-light">Pas de cours</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
