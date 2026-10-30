import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { OngletsSujets } from "@/components/OngletsSujets";
import { getPreferredClasse } from "@/lib/data";
import { enseignantsEntrainement } from "@/lib/entrainement";
import { filiereDeClasse } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sujets d'entraînement",
  description:
    "Des sujets inédits dans la manière de chaque enseignant de l'UCAC, avec leur corrigé, pour s'entraîner avant ses épreuves.",
  alternates: { canonical: "/entrainement" },
};

export const dynamic = "force-dynamic";

const initiales = (nom: string) =>
  nom
    .replace(/^(Dr|Pr|Prof|Sr|Fr|M|Mme|Mr)\.?\s+/i, "")
    .split(/\s+/)
    .filter((m) => /^[A-Za-zÀ-ÿ]/.test(m))
    .slice(0, 2)
    .map((m) => m[0]!.toUpperCase())
    .join("");

/*
 * The lecturers with Sujets d'entraînement (GLOSSARY.md), opened on the
 * student's own filière like the Annales: a chip away from the others.
 */
export default async function EntrainementPage({ searchParams }: { searchParams: Promise<{ filiere?: string }> }) {
  const [{ filiere: demandee }, classe, enseignants] = await Promise.all([
    searchParams,
    getPreferredClasse(),
    enseignantsEntrainement(),
  ]);
  const filieres = [...new Set(enseignants.flatMap((e) => e.sujets.map((s) => s.filiere)))].sort();
  const defaut = filiereDeClasse(classe);
  const filiere = demandee === "toutes" ? undefined : demandee || (filieres.includes(defaut) ? defaut : undefined);
  const visibles = filiere ? enseignants.filter((e) => e.sujets.some((s) => s.filiere === filiere)) : enseignants;

  return (
    <div className="cy-large relative min-h-dvh pb-[calc(92px+var(--safe-bottom))] lg:pb-10">
      <div className="sticky top-0 z-10 bg-white px-5 pb-2" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="flex h-11 items-center pb-1 text-[24px] font-extrabold tracking-tight">Entraînement</div>
        <OngletsSujets actif="entrainement" />
        {filieres.length > 1 && (
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {[undefined, ...filieres].map((f) => {
              const actif = f === filiere;
              return (
                <Link
                  key={f ?? "toutes"}
                  href={`/entrainement?filiere=${f ?? "toutes"}`}
                  scroll={false}
                  className={`press-scale flex h-9 flex-none items-center rounded-full px-4 text-[13.5px] font-bold ${
                    actif ? "bg-ink text-white" : "border-[1.5px] border-line-4 bg-white text-slate"
                  }`}
                >
                  {f ?? "Toutes"}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 pt-2">
        <div className="rounded-[20px] border border-teal-border bg-teal-tint-soft p-4">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-teal-dark">
            <Icon name="spark" size={17} strokeWidth={2.2} />
            Des sujets que personne n&rsquo;a encore vus
          </div>
          <p className="mt-1.5 text-[13.5px] leading-snug text-slate">
            Pour chaque enseignant, cinq sujets inédits écrits par l&rsquo;IA de Campusly dans sa manière : même structure,
            même barème, mêmes types de questions, du plus accessible au plus exigeant. Chacun a son corrigé revérifié.
            Ils ne sont pas rédigés par l&rsquo;enseignant et ne seront pas donnés à l&rsquo;examen.
          </p>
        </div>

        {visibles.length === 0 ? (
          <EmptyState
            icon="doc"
            title={filiere ? `Pas encore d'entraînement en ${filiere}` : "Bientôt disponible"}
            body="Les sujets d'entraînement arrivent enseignant par enseignant, après vérification."
          >
            {filiere && (
              <Link href="/entrainement?filiere=toutes" className="mt-3 block h-11 text-[14.5px] font-bold leading-[44px] text-teal-dark">
                Voir les autres filières
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="py-3 text-[13px] text-slate">
              {visibles.length} enseignant{visibles.length > 1 ? "s" : ""} · {visibles.length * 5} sujets
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-3 xl:grid-cols-3">
              {visibles.map((e) => {
                const matieres = [...new Set(e.sujets.map((s) => s.matiere))];
                const classes = [...new Set(e.sujets.map((s) => `${s.filiere} ${s.niveau}`))];
                return (
                  <Link
                    key={e.slug}
                    href={`/entrainement/${e.slug}`}
                    className="text-ink press-scale mb-3 flex items-start gap-3 rounded-[20px] border border-line bg-white p-3.5 transition-shadow md:mb-0 md:hover:shadow-[0_10px_24px_-16px_rgba(15,23,42,.35)]"
                  >
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-[15px] bg-[#eef0ff] text-[15px] font-black text-[#4f46e5]">
                      {initiales(e.nom)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] font-extrabold leading-tight">{e.nom}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-slate">{matieres.join(" · ")}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <span className="flex h-6 items-center rounded-full bg-teal-tint px-2.5 text-[11.5px] font-bold text-teal-dark">5 sujets + corrigés</span>
                        <span className="flex h-6 items-center rounded-full bg-surface-2 px-2.5 text-[11.5px] font-bold text-slate">{classes.join(", ")}</span>
                      </span>
                    </span>
                    <Icon name="right" size={18} className="mt-1 flex-none text-slate-light" />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
