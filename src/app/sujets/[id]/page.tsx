import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { Badge } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { SujetViewer } from "@/components/SujetViewer";
import { ShareSheet } from "@/components/ShareSheet";
import { ToastButton } from "@/components/ToastButton";
import { getRelatedSubjects, getSubjectById } from "@/lib/data";
import { incrementSubjectDownload } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const subjectId = Number(id);
  if (Number.isNaN(subjectId)) return { title: "Sujet introuvable" };
  const subject = await getSubjectById(subjectId);
  if (!subject) return { title: "Sujet introuvable" };
  return {
    title: `${subject.matiere} — ${subject.filiere} ${subject.niveau} (${subject.annee})`,
    description: `${subject.type} de ${subject.matiere} — ${subject.filiere}, ${subject.niveau}, ${subject.annee}.${subject.enseignant ? ` Enseignant : ${subject.enseignant}.` : ""}${subject.corrige ? " Corrigé disponible." : ""}`,
    alternates: { canonical: `/sujets/${subject.id}` },
  };
}

export default async function SujetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subjectId = Number(id);
  if (Number.isNaN(subjectId)) notFound();

  const subject = await getSubjectById(subjectId);
  if (!subject) notFound();

  const { sameMatiere, sameFiliere } = await getRelatedSubjects(
    subject.id,
    subject.matiere,
    subject.filiere
  );

  return (
    <div className="relative min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader
        border
        right={
          <ShareSheet>
            <button
              className="press-scale grid h-11 w-11 place-items-center"
              aria-label="Partager"
            >
              <Icon name="share" size={19} strokeWidth={1.9} />
            </button>
          </ShareSheet>
        }
      />

      <div className="px-5 pt-1">
        <div className="text-[24px] font-extrabold leading-tight tracking-tight">{subject.matiere}</div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{subject.type}</Badge>
          <Badge tone={subject.corrige ? "teal" : "neutral"}>
            {subject.corrige ? "Corrigé disponible" : "Sans corrigé"}
          </Badge>
          <Badge tone="neutral">
            {subject.filiere} · {subject.niveau}
          </Badge>
        </div>

        <SujetViewer
          subjectId={subject.id}
          matiere={subject.matiere}
          filiere={subject.filiere}
          niveau={subject.niveau}
          fileUrl={subject.fileUrl}
          correctionUrl={subject.correctionUrl}
          onRecord={incrementSubjectDownload.bind(null, subject.id)}
        />

        <div className="mt-[18px] rounded-[20px] border border-line px-3.5">
          {([
            { label: "Année", valeur: subject.annee },
            { label: "Épreuve", valeur: subject.type },
            {
              label: "Enseignant",
              valeur: subject.enseignant,
              // Tapping the name is how you find everything this lecturer has
              // given — combine it with the search box to narrow to one course.
              href: subject.enseignant
                ? `/sujets?enseignant=${encodeURIComponent(subject.enseignant)}`
                : undefined,
            },
            {
              label: "Corrigé",
              valeur: subject.correctionUrl
                ? "Disponible séparément"
                : subject.corrige
                ? "Joint au document"
                : "Pas encore",
            },
            { label: "Vérifié le", valeur: subject.createdAt.toLocaleDateString("fr-FR") },
            { label: "Téléchargements", valeur: String(subject.downloads) },
          ] as { label: string; valeur: string | null; href?: string }[])
            .filter((row) => row.valeur)
            .map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-3 border-b border-line-3 py-3 text-[14px] last:border-b-0"
              >
                <span className="text-slate-light">{row.label}</span>
                {row.href ? (
                  <Link href={row.href} className="text-right font-bold text-teal-dark underline">
                    {row.valeur}
                  </Link>
                ) : (
                  <span className="text-right font-bold">{row.valeur}</span>
                )}
              </div>
            ))}
        </div>

        {sameMatiere.length > 0 && (
          <>
            <div className="mb-0.5 mt-6 text-[17px] font-extrabold tracking-tight">
              Autres documents de {subject.matiere}
            </div>
            {sameMatiere.map((s) => (
              <Link
                key={s.id}
                href={`/sujets/${s.id}`}
                prefetch={false}
                className="flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
              >
                <span className="grid h-[50px] w-[42px] flex-none place-items-center rounded-[10px] bg-surface text-teal-active">
                  <Icon name={s.type === "TD" ? "inbox" : "doc"} size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-bold">
                    {s.type} · {s.annee}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-slate-light">
                    {s.filiere} · {s.niveau}
                    {s.corrige ? " · corrigé" : ""}
                  </span>
                </span>
                <Icon name="right" size={18} className="text-slate-light" />
              </Link>
            ))}
          </>
        )}

        {sameFiliere.length > 0 && (
          <>
            <div className="mb-0.5 mt-6 text-[17px] font-extrabold tracking-tight">Dans la même filière</div>
            {sameFiliere.map((s) => (
              <Link
                key={s.id}
                href={`/sujets/${s.id}`}
                prefetch={false}
                className="flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
              >
                <span className="grid h-[50px] w-[42px] flex-none place-items-center rounded-[10px] bg-surface text-teal-active">
                  <Icon name={s.type === "TD" ? "inbox" : "doc"} size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-bold">{s.matiere}</span>
                  <span className="mt-0.5 block text-[12.5px] text-slate-light">
                    {s.niveau} · {s.annee} · {s.type}
                  </span>
                </span>
                <Icon name="right" size={18} className="text-slate-light" />
              </Link>
            ))}
          </>
        )}

        <ToastButton
          message="Signalement envoyé à l'équipe"
          icon="flag"
          className="press-scale mt-5 flex h-12 w-full items-center justify-center gap-2 border-0 bg-none text-[13.5px] font-bold text-slate-light"
        >
          Signaler un problème sur ce sujet
        </ToastButton>
      </div>
    </div>
  );
}
