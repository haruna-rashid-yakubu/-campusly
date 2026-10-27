import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Journee } from "@/lib/journee";
import { CARTE, TitreSection } from "@/components/TitreSection";

/*
 * The answer to "what's my next class, and where?", first under the greeting.
 * The room is the loudest thing on the card: it is what a student is looking
 * for while walking across campus.
 */
export function MaJournee({ journee, classe, clair = false }: { journee: Journee; classe: string; clair?: boolean }) {
  if (!journee) {
    return (
      <section className="mx-5 mt-7">
      <TitreSection clair={clair}>Ma journée</TitreSection>
      <Link href="/programme" className={`press-scale flex items-center gap-3 p-4 active:bg-surface-3 ${CARTE}`}>
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-teal-tint text-teal-dark">
          <Icon name="cal" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-extrabold">Pas de cours prévu</span>
          <span className="mt-0.5 block text-[13px] text-slate">
            Le programme de {classe} pour les prochains jours n&rsquo;est pas encore publié.
          </span>
        </span>
        <Icon name="right" size={18} className="flex-none text-slate-light" />
      </Link>
      </section>
    );
  }

  return (
    <section className="anim-fade mx-5 mt-7">
      <TitreSection clair={clair} lien={{ href: "/programme", label: "Voir la semaine" }}>{journee.libelle}</TitreSection>
      <div className={`overflow-hidden ${CARTE}`}>
      {journee.cours.map((c) => (
        <div key={c.heures + c.matiere} className="flex gap-3 border-t border-line-3 p-4 first:border-t-0">
          <div className="w-[62px] flex-none pt-0.5 text-[13px] font-bold tabular-nums text-slate">{c.heures}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-extrabold leading-snug">{c.matiere}</span>
              {c.enCours && (
                <span className="rounded-full bg-teal-tint px-2 py-0.5 text-[11.5px] font-extrabold text-teal-active">
                  En cours
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 text-[13px] text-slate">
              {c.salle && <span className="font-bold text-ink">{c.salle}</span>}
              {c.enseignant && <span>{c.enseignant}</span>}
              {c.cc && <span className="font-bold text-danger">Contrôle continu</span>}
            </div>
          </div>
        </div>
      ))}
      </div>
    </section>
  );
}
