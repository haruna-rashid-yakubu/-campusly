import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { EntrainementViewer } from "@/components/EntrainementViewer";
import { Icon } from "@/components/icons";
import { SignInButton } from "@/components/SignInButton";
import { enseignantEntrainement, lienEntrainement, lireEntrainement } from "@/lib/entrainement";
import { jetonFichier } from "@/lib/jeton";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, n } = await params;
  const e = await enseignantEntrainement(slug);
  const s = e?.sujets.find((x) => x.n === Number(n));
  if (!e || !s) return { title: "Sujet introuvable" };
  return {
    title: `${s.matiere} — sujet d'entraînement ${s.n}`,
    description: `Sujet d'entraînement inédit de ${s.matiere} (${s.filiere} ${s.niveau}) dans la manière de ${e.nom}, avec son corrigé.`,
    alternates: { canonical: `/entrainement/${e.slug}/${s.n}` },
  };
}

/*
 * A Sujet d'entraînement: what it is, then, for a signed-in student, the paper
 * and its corrigé. Its nature is said before anything else: written in the
 * lecturer's manner, not by them.
 */
export default async function SujetEntrainementPage({ params }: Params) {
  const { slug, n } = await params;
  const [e, session] = await Promise.all([enseignantEntrainement(slug), auth()]);
  const s = e?.sujets.find((x) => x.n === Number(n));
  if (!e || !s) notFound();
  const userId = session?.user?.id;
  const lectures = userId ? await lireEntrainement(e.slug, s.n) : null;
  const jeton = userId ? jetonFichier(userId) : undefined;

  return (
    <div className="cy-large relative min-h-dvh pb-[calc(92px+var(--safe-bottom))] lg:pb-10">
      <BackHeader border fallbackHref={`/entrainement/${e.slug}`} />
      <div className="px-5 pt-2">
        <h1 className="text-[25px] font-extrabold leading-[1.15] tracking-tight">{s.matiere}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] font-semibold text-slate">
          <span>
            Entraînement {s.n}/5 · {s.type} · {s.filiere} {s.niveau}
          </span>
          <span className="flex h-6 items-center gap-1 rounded-full bg-[#eef0ff] px-2.5 text-[11.5px] font-black text-[#4f46e5]">
            <Icon name="spark" size={12} strokeWidth={2.4} />
            Non rédigé par l&rsquo;enseignant
          </span>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          <div className="min-w-0">
            {lectures ? (
              <EntrainementViewer
                matiere={s.matiere}
                type={s.type}
                urls={{ sujet: lienEntrainement(e.slug, s.n, false, jeton), corrige: lienEntrainement(e.slug, s.n, true, jeton) }}
                lectures={lectures}
              />
            ) : userId ? (
              <div className="mt-4 rounded-[20px] border border-line bg-surface px-5 py-7 text-center text-[14px] text-slate">
                Ce sujet n&rsquo;est pas disponible pour le moment.
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-line bg-surface px-5 py-7 text-center">
                <span className="mx-auto mb-4 grid h-[60px] w-[60px] place-items-center rounded-[20px] bg-white text-teal-dark">
                  <Icon name="lock" size={26} strokeWidth={1.7} />
                </span>
                <div className="text-[17px] font-extrabold">Connecte-toi pour t&rsquo;entraîner</div>
                <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-slate">
                  Le sujet, son corrigé et les PDF sont réservés aux étudiants connectés. C&rsquo;est gratuit, avec ton compte Google.
                </p>
                <SignInButton className="press-scale mx-auto mt-5 flex h-[52px] w-full max-w-xs items-center justify-center rounded-2xl border-[1.5px] border-line-4 bg-white text-[15px] font-bold active:bg-surface-3" />
              </div>
            )}
          </div>

          <aside className="min-w-0">
            <h2 className="mt-7 text-[17px] font-extrabold tracking-tight">Détails</h2>
            <div className="mt-3 rounded-[20px] border border-line px-3.5">
              {(
                [
                  ["Dans la manière de", e.nom, `/entrainement/${e.slug}`],
                  ["Durée", s.duree],
                  ["Langue", s.langue === "en" ? "Anglais" : "Français"],
                  ["Corrigé", "Rédigé puis revérifié par l'IA"],
                ] as [string, string, string?][]
              )
                .filter(([, v]) => v)
                .map(([k, v, href]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-line-3 py-3 text-[14px] last:border-b-0">
                    <span className="text-slate-light">{k}</span>
                    {href ? (
                      <Link href={href} className="text-right font-bold text-teal-dark underline">
                        {v}
                      </Link>
                    ) : (
                      <span className="text-right font-bold">{v}</span>
                    )}
                  </div>
                ))}
            </div>

            <div className="mb-0.5 mt-7 text-[17px] font-extrabold tracking-tight">Ses autres sujets d&rsquo;entraînement</div>
            {e.sujets
              .filter((x) => x.n !== s.n)
              .map((x) => (
                <Link
                  key={x.n}
                  href={`/entrainement/${e.slug}/${x.n}`}
                  className="text-ink flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
                >
                  <span className="grid h-[50px] w-[42px] flex-none place-items-center rounded-[10px] bg-surface text-[17px] font-black text-teal-active">
                    {x.n}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14.5px] font-bold">{x.matiere}</span>
                    <span className="mt-0.5 block text-[12.5px] text-slate-light">
                      {x.type} · {x.filiere} {x.niveau}
                    </span>
                  </span>
                  <Icon name="right" size={18} className="text-slate-light" />
                </Link>
              ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
