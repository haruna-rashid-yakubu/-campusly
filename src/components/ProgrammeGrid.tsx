import { Icon } from "@/components/icons";
import { CRENEAUX, heuresDe, JOURS } from "@/lib/constants";
import { DefilerVersAujourdhui } from "@/components/DefilerVersAujourdhui";

type Creneau = {
  jour: number;
  debut: number;
  fin: number;
  matiere: string;
  enseignant: string | null;
  salle: string | null;
  seance: number | null;
  seances: number | null;
  cc: boolean;
};

type Segment =
  | { type: "cours"; creneau: Creneau }
  | { type: "libre"; debut: number; fin: number };

/*
 * A day is read slot by slot rather than as a morning and an afternoon,
 * because the faculty prints both shapes: one course from 8h to 12h, or two
 * courses sharing that morning. Consecutive free slots are merged, so an
 * empty afternoon is one line and not two.
 */
function decouper(creneaux: Creneau[], jour: number): Segment[] {
  const duJour = creneaux.filter((c) => c.jour === jour).sort((a, b) => a.debut - b.debut);
  const segments: Segment[] = [];
  let slot = 1;
  let libreDepuis: number | null = null;

  const fermerLibre = (jusqua: number) => {
    if (libreDepuis !== null) {
      segments.push({ type: "libre", debut: libreDepuis, fin: jusqua });
      libreDepuis = null;
    }
  };

  while (slot <= CRENEAUX.length) {
    const c = duJour.find((x) => x.debut === slot);
    if (!c) {
      libreDepuis ??= slot;
      slot += 1;
      continue;
    }
    fermerLibre(slot - 1);
    segments.push({ type: "cours", creneau: c });
    slot = c.fin + 1;
  }
  fermerLibre(CRENEAUX.length);

  return segments;
}

/*
 * Every day from Monday to Saturday is listed, including the ones with
 * nothing in them. Dropping an empty day saved screen space and cost
 * clarity: a student who does not see Wednesday cannot tell "no class" from
 * "nobody filled it in". Saying it plainly is the whole point.
 */
export function ProgrammeGrid({
  creneaux,
  salleDefaut,
  aujourdhui = null,
}: {
  creneaux: Creneau[];
  salleDefaut: string | null;
  // 1 = lundi … 6 = samedi when the week on screen is this week: that day is marked.
  aujourdhui?: number | null;
}) {
  return (
    <div>
      {aujourdhui && <DefilerVersAujourdhui />}
      {JOURS.map((label, i) => {
        const jour = i + 1;
        const estAujourdhui = jour === aujourdhui;
        return (
          <div
            key={label}
            id={estAujourdhui ? "aujourdhui" : undefined}
            className={`mb-3 scroll-mt-48 overflow-hidden rounded-[20px] border ${estAujourdhui ? "border-[1.5px] border-teal" : "border-line"}`}
          >
            <div
              className={`flex items-center justify-between px-4 py-2 text-[13.5px] font-extrabold ${estAujourdhui ? "bg-teal-tint text-teal-active" : "bg-surface"}`}
            >
              {label}
              {estAujourdhui && <span className="text-[12px] uppercase tracking-wide">Aujourd&rsquo;hui</span>}
            </div>
            {decouper(creneaux, jour).map((seg) =>
              seg.type === "libre" ? (
                // A free stretch is said, but quietly: one line, not a block.
                <div key={`l${seg.debut}`} className="flex gap-2 border-t border-line-3 px-4 py-2 text-[13px] text-slate">
                  <span className="font-bold">{heuresDe(seg.debut, seg.fin)}</span>
                  <span>Pas de cours</span>
                </div>
              ) : (
                <div key={`c${seg.creneau.debut}`} className="border-t border-line-3 px-4 py-3">
                  <div className="text-[13px] font-bold text-slate">
                    {heuresDe(seg.creneau.debut, seg.creneau.fin)}
                  </div>
                  <div className="mt-1 text-[15.5px] font-extrabold leading-snug">
                    {seg.creneau.matiere}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-slate">
                    {seg.creneau.enseignant && <span>{seg.creneau.enseignant}</span>}
                    <span className="font-semibold text-ink-soft">
                      {seg.creneau.salle ?? salleDefaut ?? ""}
                    </span>
                    {seg.creneau.seance && seg.creneau.seances && (
                      <span>
                        séance {seg.creneau.seance}/{seg.creneau.seances}
                      </span>
                    )}
                  </div>
                  {seg.creneau.cc && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-danger-tint px-2.5 py-1 text-[12px] font-extrabold text-danger">
                      <Icon name="flag" size={14} strokeWidth={2.3} />
                      Contrôle continu
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
