import { notFound } from "next/navigation";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { getSubjectById } from "@/lib/data";
import { auth } from "@/auth";
import { ouvrir } from "@/lib/acces";
import { lienFichier } from "@/lib/fichiers";
import { jetonFichier } from "@/lib/jeton";
import { redirect } from "next/navigation";

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

  // Same door as the Sujet's page, which explains a refusal.
  const acces = await ouvrir((await auth())?.user?.id ?? null, subject.id);
  if (!acces.ok) redirect(`/sujets/${subject.id}`);
  const jeton = jetonFichier(acces.userId);

  const isCorrection = mode === "correction";
  const fileUrl = isCorrection
    ? lienFichier(subject.id, subject.correctionUrl, true, jeton)
    : lienFichier(subject.id, subject.fileUrl, false, jeton);
  const title = isCorrection ? `${subject.matiere} — Corrigé` : subject.matiere;

  return (
    <FullscreenViewer
      title={title}
      fileUrl={fileUrl}
      closeHref={`/sujets/${subject.id}`}
    />
  );
}
