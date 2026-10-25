import { NextResponse } from "next/server";
import { getClasseByLabel, getLatestProgramme, getPreferredClasse, getTroncCommun } from "@/lib/data";

export const dynamic = "force-dynamic";

// The promo comes from the X-Campusly-Classe header, as the cookie does on the web.
export async function GET() {
  const classe = await getPreferredClasse();
  const classeRow = await getClasseByLabel(classe);
  const [programme, troncCommun] = classeRow
    ? await Promise.all([getLatestProgramme(classeRow.id), getTroncCommun(classeRow.id)])
    : [null, null];
  return NextResponse.json({ classe, programme, troncCommun });
}
