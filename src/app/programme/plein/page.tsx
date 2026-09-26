import { notFound } from "next/navigation";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { getClasseByLabel, getLatestProgramme, getPreferredClasse } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProgrammePleinPage() {
  const classe = await getPreferredClasse();
  const classeRow = await getClasseByLabel(classe);
  const programme = classeRow ? await getLatestProgramme(classeRow.id) : null;
  // A week can now exist as a grid with no photograph behind it, and there is
  // nothing to show full screen in that case.
  if (!programme?.photoUrl) notFound();

  return <FullscreenViewer title={classe} fileUrl={programme.photoUrl} closeHref="/programme" />;
}
