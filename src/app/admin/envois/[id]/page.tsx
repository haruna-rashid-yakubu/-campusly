import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { EmptyState, Badge } from "@/components/EmptyState";
import { FilePreview } from "@/components/FilePreview";
import { SignInRequired } from "@/components/SignInRequired";
import { SubmissionReview } from "@/components/admin/SubmissionReview";
import { subjectTypeEnum } from "@/db/schema";
import { getProposerFacets, getSubjectFacets, getSubmissionById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Relire un envoi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <SignInRequired backHref="/admin" title="Relire un envoi" />;
  if (session.user.role !== "admin") {
    return (
      <div className="min-h-dvh">
        <BackHeader title="Relire un envoi" fallbackHref="/" border />
        <EmptyState
          icon="lock"
          title="Réservé à l'équipe Campusly"
          body="Ton compte n'a pas les droits d'administration."
        />
      </div>
    );
  }

  const { id } = await params;
  const submissionId = Number(id);
  if (Number.isNaN(submissionId)) notFound();

  const [submission, proposerFacets, subjectFacets] = await Promise.all([
    getSubmissionById(submissionId),
    getProposerFacets(),
    getSubjectFacets(),
  ]);
  if (!submission) notFound();

  const decided = submission.status !== "en_attente";

  return (
    <div className="min-h-dvh pb-12">
      <BackHeader title="Relire un envoi" fallbackHref="/admin?tab=sujets" border />

      <div className="px-5 pt-3">
        <div className="flex items-center gap-3 rounded-[15px] border border-line bg-surface-3 p-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-teal text-[15px] font-extrabold text-white">
            {submission.user.name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold">
              {submission.user.name ?? "Étudiant"}
            </div>
            <div className="truncate text-[12.5px] text-slate-light">
              Envoyé le {submission.createdAt.toLocaleDateString("fr-FR")}
            </div>
          </div>
          {decided && (
            <Badge tone={submission.status === "publie" ? "teal" : "danger"}>
              {submission.status === "publie" ? "Publié" : "Refusé"}
            </Badge>
          )}
        </div>

        {submission.fileUrl ? (
          <FilePreview
            url={submission.fileUrl}
            className="mt-4 h-[62vh] w-full rounded-[18px] border border-line"
          />
        ) : (
          <div className="mt-4 grid h-40 place-items-center rounded-[18px] border-[1.5px] border-dashed border-line-2 px-5 text-center text-[13.5px] text-slate-light">
            Aucun document joint à cet envoi.
          </div>
        )}

        {decided ? (
          <div className="mt-5 rounded-[18px] border border-line bg-surface-3 p-4 text-[13.5px] leading-relaxed text-slate">
            Cet envoi a déjà été traité
            {submission.reviewedAt
              ? ` le ${submission.reviewedAt.toLocaleDateString("fr-FR")}`
              : ""}
            .{submission.note ? ` Motif : ${submission.note}` : ""}
          </div>
        ) : (
          <SubmissionReview
            submissionId={submission.id}
            initial={{
              matiere: submission.matiere,
              filiere: submission.filiere,
              niveau: submission.niveau,
              annee: submission.annee,
              type: submission.type,
              enseignant: "",
              corrige: false,
            }}
            facets={{ ...proposerFacets, enseignant: subjectFacets.enseignant }}
            types={subjectTypeEnum}
          />
        )}
      </div>
    </div>
  );
}
