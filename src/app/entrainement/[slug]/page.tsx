import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { Icon } from "@/components/icons";
import { enseignantEntrainement } from "@/lib/entrainement";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await enseignantEntrainement((await params).slug);
  if (!e) return { title: "Enseignant introuvable" };
  return {
    title: `S'entraîner pour ${e.nom}`,
    description: `Cinq sujets d'entraînement inédits dans la manière de ${e.nom}, avec leurs corrigés.`,
    alternates: { canonical: `/entrainement/${e.slug}` },
  };
}

// From the first paper to the fifth, the progression the papers are written to (scripts/entrainement-redaction.md).
const NIVEAUX = ["Accessible", "Accessible", "Intermédiaire", "Exigeant", "Le plus exigeant"];

/*
 * A lecturer's page: how they set their papers, as read from them, then the
 * five Sujets d'entraînement written that way.
 */
export default async function EnseignantEntrainementPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await enseignantEntrainement((await params).slug);
  if (!e) notFound();
  // "Matières" says it in the title's line; the rest describes the manner.
  const profil = e.profil.filter(([k]) => !/^mati/i.test(k));
  const matieres = [...new Set(e.sujets.map((s) => s.matiere))];

  return (
    <div className="cy-large relative min-h-dvh pb-[calc(92px+var(--safe-bottom))] lg:pb-10">
      <BackHeader border fallbackHref="/entrainement" />
      <div className="px-5 pt-2">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[.08em] text-teal-dark">S&rsquo;entraîner pour</div>
        <h1 className="mt-1 text-[25px] font-extrabold leading-[1.15] tracking-tight">{e.nom}</h1>
        <div className="mt-1.5 text-[14px] font-semibold text-slate">{matieres.join(" · ")}</div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <h2 className="mt-7 text-[17px] font-extrabold tracking-tight">Les 5 sujets</h2>
            <p className="mt-1 text-[13.5px] text-slate">Du plus accessible au plus exigeant, chacun avec son corrigé.</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {e.sujets.map((s) => (
                <Link
                  key={s.n}
                  href={`/entrainement/${e.slug}/${s.n}`}
                  className="text-ink press-scale flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-3.5 md:hover:shadow-[0_10px_24px_-16px_rgba(15,23,42,.35)]"
                >
                  <span className="grid h-[52px] w-[46px] flex-none place-items-center rounded-[12px] bg-surface text-[19px] font-black text-teal-dark">
                    {s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold leading-tight">{s.matiere}</span>
                    <span className="mt-0.5 block text-[13px] text-slate">
                      {s.type} · {s.filiere} {s.niveau}
                      {s.duree ? ` · ${s.duree}` : ""}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={`h-1.5 w-4 rounded-full ${i <= s.n ? "bg-teal" : "bg-line-3"}`} />
                      ))}
                      <span className="ml-1.5 text-[11.5px] font-bold text-slate-light">{NIVEAUX[s.n - 1]}</span>
                    </span>
                  </span>
                  <Icon name="right" size={18} className="flex-none text-slate-light" />
                </Link>
              ))}
            </div>
          </div>

          <aside className="min-w-0">
            {profil.length > 0 && (
              <>
                <h2 className="mt-7 text-[17px] font-extrabold tracking-tight">Sa manière d&rsquo;interroger</h2>
                <div className="mt-3 rounded-[20px] border border-line px-4">
                  {profil.map(([k, v]) => (
                    <div key={k} className="border-b border-line-3 py-3 last:border-b-0">
                      <div className="text-[12px] font-extrabold uppercase tracking-[.06em] text-slate-light">{k}</div>
                      <div className="mt-1 text-[14px] leading-relaxed">{v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className="mt-4 flex items-start gap-2 text-[13px] leading-snug text-slate">
              <Icon name="warn" size={16} className="mt-0.5 flex-none" />
              <span>
                Fiche et sujets rédigés par l&rsquo;IA de Campusly à partir des anciens sujets de l&rsquo;enseignant, qui n&rsquo;en
                est pas l&rsquo;auteur. Ils ne seront pas donnés à l&rsquo;examen.
              </span>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
