import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Journee } from "@/lib/journee";

/*
 * The answer to "what's my next class, and where?", first under the greeting.
 * The room is the loudest thing on the card: it is what a student is looking
 * for while walking across campus.
 */
export function MaJournee({ journee, classe }: { journee: Journee; classe: string }) {
  if (!journee) {
    return (
      <Link
        href="/programme"
        className="press-scale mx-5 mt-5 flex items-center gap-3 rounded-[20px] border border-line bg-white p-4 active:bg-surface-3"
      >
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-surface text-teal-dark">
          <Icon name="cal" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold">Pas de cours prévu</span>
          <span className="mt-0.5 block text-[13.5px] text-slate">
            Le programme de {classe} pour les prochains jours n&rsquo;est pas encore publié.
          </span>
        </span>
        <Icon name="right" size={18} className="flex-none text-slate" />
      </Link>
    );
  }

  return (
    <section className="anim-fade mx-5 mt-5 overflow-hidden rounded-[20px] border border-line bg-white">
      <div className="flex items-center justify-between bg-surface px-4 py-2.5">
        <span className="text-[13.5px] font-extrabold">{journee.libelle}</span>
        <Link href="/programme" className="text-[13.5px] font-bold text-teal-dark">
          Voir la semaine
        </Link>
      </div>
      {journee.cours.map((c) => (
        <div key={c.heures + c.matiere} className="flex gap-3 border-t border-line-3 px-4 py-3 first:border-t-0">
          <div className="w-[64px] flex-none pt-0.5 text-[13px] font-bold text-slate">{c.heures}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15.5px] font-extrabold leading-snug">{c.matiere}</span>
              {c.enCours && (
                <span className="rounded-full bg-teal-tint px-2 py-0.5 text-[11.5px] font-extrabold text-teal-active">
                  En cours
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13.5px] text-slate">
              {c.salle && <span className="font-bold text-ink">{c.salle}</span>}
              {c.enseignant && <span>{c.enseignant}</span>}
              {c.cc && <span className="font-bold text-danger">Contrôle continu</span>}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
