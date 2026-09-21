import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilePreview } from "@/components/FilePreview";
import { Icon } from "@/components/icons";
import { SignInRequired } from "@/components/SignInRequired";
import { SubjectEditForm } from "@/components/admin/SubjectEditForm";
import { subjectTypeEnum } from "@/db/schema";
import { getProposerFacets, getSubjectById, getSubjectFacets } from "@/lib/data";

export const metadata: Metadata = {
  title: "Modifier un sujet",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <SignInRequired backHref="/admin" title="Modifier un sujet" />;
  if (session.user.role !== "admin") {
    return (
      <div className="min-h-dvh">
        <BackHeader title="Modifier un sujet" fallbackHref="/" border />
        <EmptyState
          icon="lock"
          title="Réservé à l'équipe Campusly"
          body="Ton compte n'a pas les droits d'administration."
        />
      </div>
    );
  }

  const { id } = await params;
  const subjectId = Number(id);
  if (Number.isNaN(subjectId)) notFound();

  const [subject, proposerFacets, subjectFacets] = await Promise.all([
    getSubjectById(subjectId),
    getProposerFacets(),
    getSubjectFacets(),
  ]);
  if (!subject) notFound();

  return (
    <div className="min-h-dvh pb-12">
      <BackHeader title="Modifier un sujet" fallbackHref="/admin?tab=publies" border />

      <div className="px-5 pt-3">
        <div className="text-[20px] font-extrabold leading-tight tracking-tight">
          {subject.matiere}
        </div>
        <Link
          href={`/sujets/${subject.id}`}
          prefetch={false}
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold text-teal-dark"
        >
          Voir la fiche publique
          <Icon name="right" size={15} strokeWidth={2} />
        </Link>

        {subject.fileUrl ? (
          <FilePreview
            url={subject.fileUrl}
            className="mt-3.5 h-[46vh] w-full rounded-[18px] border border-line"
          />
        ) : (
          <div className="mt-3.5 grid h-32 place-items-center rounded-[18px] border-[1.5px] border-dashed border-line-2 px-5 text-center text-[13.5px] text-slate-light">
            Aucun document attaché.
          </div>
        )}

        <SubjectEditForm
          subjectId={subject.id}
          initial={{
            matiere: subject.matiere,
            filiere: subject.filiere,
            niveau: subject.niveau,
            annee: subject.annee,
            type: subject.type,
            enseignant: subject.enseignant ?? "",
            corrige: subject.corrige,
          }}
          facets={{ ...proposerFacets, enseignant: subjectFacets.enseignant }}
          types={subjectTypeEnum}
        />
      </div>
    </div>
  );
}
