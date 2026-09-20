import { notFound } from "next/navigation";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { getSubjectById } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SujetPleinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subject = await getSubjectById(Number(id));
  if (!subject) notFound();

  return (
    <FullscreenViewer title={subject.matiere} fileUrl={subject.fileUrl} closeHref={`/sujets/${subject.id}`} />
  );
}
