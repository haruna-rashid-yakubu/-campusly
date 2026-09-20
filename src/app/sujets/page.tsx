import Link from "next/link";
import { auth } from "@/auth";
import { Icon } from "@/components/icons";
import { Badge, EmptyState } from "@/components/EmptyState";
import { SujetsFilterBar } from "@/components/SujetsFilterBar";
import { getSubjects, getUserSubmissions } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SujetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filiere?: string; niveau?: string; annee?: string; type?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  const [subjects, submissions] = await Promise.all([
    getSubjects(params),
    session?.user ? getUserSubmissions(session.user.id) : Promise.resolve([]),
  ]);

  const hasPending = submissions.some((s) => s.status === "en_attente");
  const hasFilters = Boolean(params.q || params.filiere || params.niveau || params.annee || params.type);

  return (
    <div className="relative min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="sticky top-0 z-10 bg-white px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="flex items-center gap-2.5 pb-1">
          <div className="flex-1 whitespace-nowrap text-[24px] font-extrabold tracking-tight">
            Anciens sujets
          </div>
          <Link
            href="/sujets/mes-envois"
            className="press-scale relative grid h-11 w-11 place-items-center rounded-[14px] border-[1.5px] border-line active:bg-surface-2"
            aria-label="Mes envois"
          >
            <Icon name="inbox" size={21} strokeWidth={1.8} />
            {hasPending && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal" />
            )}
          </Link>
          <Link
            href="/sujets/proposer"
            className="press-scale grid h-11 w-11 place-items-center rounded-[14px] bg-teal text-white active:bg-teal-press"
            aria-label="Proposer un sujet"
          >
            <Icon name="plus" size={20} strokeWidth={2.2} />
          </Link>
        </div>
        <SujetsFilterBar />
      </div>

      <div className="relative px-5 pt-1">
        {subjects.length === 0 ? (
          <EmptyState icon="doc" title="Aucun sujet ici" body="Personne n'a encore envoyé de sujet pour cette recherche. Tu en as un sur ton téléphone ?">
            <Link
              href="/sujets/proposer"
              className="press-scale mt-5 inline-flex h-[50px] items-center gap-2 rounded-2xl bg-teal px-5 text-[15px] font-bold text-white"
            >
              <Icon name="plus" size={20} strokeWidth={2.2} />
              Proposer un sujet
            </Link>
            {hasFilters && (
              <Link href="/sujets" className="mt-1.5 block h-11 text-[14.5px] font-bold leading-[44px] text-teal-dark">
                Effacer les filtres
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="py-1.5 text-[13px] text-slate-light">
              {subjects.length} sujet{subjects.length > 1 ? "s" : ""} · du plus récent
            </div>
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/sujets/${s.id}`}
                className="press-scale mb-3 block rounded-[20px] border border-line bg-white p-3.5 active:bg-surface-3"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-[58px] w-12 flex-none place-items-center rounded-[10px] bg-surface text-teal-dark">
                    <Icon name="doc" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15.5px] font-extrabold leading-tight">{s.matiere}</div>
                    <div className="mt-0.5 text-[12.5px] text-slate-light">
                      {s.filiere} · {s.niveau} · {s.annee}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">{s.type}</Badge>
                      <Badge tone={s.corrige ? "teal" : "neutral"}>
                        {s.corrige ? "Corrigé" : "Sans corrigé"}
                      </Badge>
                    </div>
                  </div>
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
                    <Icon name="down" size={19} strokeWidth={1.9} />
                  </span>
                </div>
              </Link>
            ))}

            <div className="mb-2.5 mt-1.5 rounded-[20px] border-[1.5px] border-dashed border-teal-border bg-teal-tint-soft p-5 text-center">
              <div className="text-[15.5px] font-extrabold">Tu as un sujet sur ton téléphone ?</div>
              <p className="mt-1.5 text-[13.5px] leading-snug text-slate">
                Envoie-le : il profite à toute ta promo après vérification.
              </p>
              <Link
                href="/sujets/proposer"
                className="press-scale mt-3.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-teal text-[15px] font-bold text-white active:bg-teal-press"
              >
                <Icon name="plus" size={20} strokeWidth={2.2} />
                Proposer un sujet
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
