import { notFound } from "next/navigation";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { getSubjectById } from "@/lib/data";
import { lienFichier } from "@/lib/fichiers";

export const dynamic = "force-dynamic";

export default async function SujetPleinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const subject = await getSubjectById(Number(id));
  if (!subject) notFound();

  const isCorrection = mode === "correction";
  const fileUrl = isCorrection
    ? lienFichier(subject.id, subject.correctionUrl, true)
    : lienFichier(subject.id, subject.fileUrl);
  const title = isCorrection ? `${subject.matiere} — Corrigé` : subject.matiere;

  return (
    <FullscreenViewer
      title={title}
      fileUrl={fileUrl}
      closeHref={`/sujets/${subject.id}`}
    />
  );
}
