import { notFound } from "next/navigation";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { getEvenement } from "@/lib/evenements";

export default async function EvenementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = getEvenement(id);
  if (!e) notFound();
  return <FullscreenViewer title={e.nom} fileUrl={e.affiche} closeHref="/" />;
}
