import { notFound, redirect } from "next/navigation";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { getClasseByLabel, getClasseChoisie, getLatestProgramme } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProgrammePleinPage() {
  /*
   * No default promo here. This page is reached by a shared link, which walks
   * past the promo question on purpose, so falling back would show one promo's
   * board full screen to a student of another -- titled with a promo they
   * never chose. Nothing to show is the honest answer.
   */
  const classe = await getClasseChoisie();
  // Sent back rather than refused: /programme is where the promo gets asked,
  // and it is where they were trying to go.
  if (!classe) redirect("/programme");

  const classeRow = await getClasseByLabel(classe);
  const programme = classeRow ? await getLatestProgramme(classeRow.id) : null;
  // A week can now exist as a grid with no photograph behind it, and there is
  // nothing to show full screen in that case.
  if (!programme?.photoUrl) notFound();

  return <FullscreenViewer title={classe} fileUrl={programme.photoUrl} closeHref="/programme" />;
}
