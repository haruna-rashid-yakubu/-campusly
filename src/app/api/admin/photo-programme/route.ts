import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { programmePublications } from "@/db/schema";
import { uploadFile } from "@/lib/blob";
import { getClasseByLabel, getProgrammeForWeek } from "@/lib/data";
import { fromISODate, mondayOf } from "@/lib/semaine";

export const dynamic = "force-dynamic";

/*
 * Attaches the photograph of the noticeboard to a week that was filled in
 * from outside the admin screen.
 *
 * The upload happens here rather than anywhere else so that the storage token
 * never leaves the deployment: the caller sends an image and a bearer secret,
 * and the server is the only thing that ever holds the credential.
 *
 * Replacing an existing photo leaves the old blob behind. That is deliberate —
 * deleting it would make a re-upload that fails halfway destroy the only copy
 * of the week's original, and an orphaned image costs storage, not trust.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classe = await getClasseByLabel(searchParams.get("classe") ?? "");
  if (!classe) return NextResponse.json({ error: "Classe inconnue." }, { status: 404 });

  const semaine = mondayOf(fromISODate(searchParams.get("semaine") ?? ""));
  if (Number.isNaN(semaine.getTime())) {
    return NextResponse.json({ error: "Semaine invalide." }, { status: 400 });
  }

  const programme = await getProgrammeForWeek(classe.id, semaine, { brut: true });
  if (!programme) {
    return NextResponse.json({ error: "Aucun programme pour cette semaine." }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const uploaded = await uploadFile(file, "programme");
  await db
    .update(programmePublications)
    .set({ photoUrl: uploaded.url })
    .where(eq(programmePublications.id, programme.id));

  return NextResponse.json({ ok: true, classe: classe.label, photoUrl: uploaded.url });
}
