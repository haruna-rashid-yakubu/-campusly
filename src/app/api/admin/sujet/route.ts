import { NextResponse } from "next/server";
import { db } from "@/db";
import { subjectTypeEnum, subjects } from "@/db/schema";
import { uploadFile } from "@/lib/blob";

export const dynamic = "force-dynamic";

/*
 * Publishes one past paper that was photographed off a sheet rather than
 * submitted through the app.
 *
 * The papers arrive in batches — a promo empties a drawer and sends twenty
 * photographs at once — and the review screen is built for one student's
 * submission at a time. This is the back door for that case: the file and its
 * labels in a single call, so a batch is a loop rather than an evening.
 *
 * The upload happens here, like the programme photograph, so the storage
 * token stays inside the deployment. The caller only ever holds the bearer
 * secret.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const form = await request.formData();
  const champ = (nom: string) => (form.get(nom) ?? "").toString().trim();

  const matiere = champ("matiere");
  const filiere = champ("filiere");
  const niveau = champ("niveau");
  const annee = champ("annee");
  const type = champ("type");
  const enseignant = champ("enseignant");
  // Optional, and the thing that stops two papers of the same sitting
  // arriving as two identical cards.
  const variante = champ("variante");

  if (!matiere || !filiere || !niveau || !annee) {
    return NextResponse.json(
      { error: "matiere, filiere, niveau et annee sont obligatoires." },
      { status: 400 }
    );
  }
  if (!subjectTypeEnum.includes(type as (typeof subjectTypeEnum)[number])) {
    return NextResponse.json(
      { error: `Type invalide. Attendu : ${subjectTypeEnum.join(", ")}.` },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const uploaded = await uploadFile(file, "sujets");

  const [created] = await db
    .insert(subjects)
    .values({
      matiere,
      filiere,
      niveau,
      annee,
      type: type as (typeof subjectTypeEnum)[number],
      enseignant: enseignant || null,
      variante: variante || null,
      corrige: champ("corrige") === "1",
      fileUrl: uploaded.url,
      fileName: uploaded.name,
    })
    .returning({ id: subjects.id });

  return NextResponse.json({ ok: true, id: created.id, fileUrl: uploaded.url });
}
