import { NextResponse } from "next/server";
import { db } from "@/db";
import { cites, roomTypes } from "@/db/schema";
import { uploadFile } from "@/lib/blob";

export const dynamic = "force-dynamic";

type ChambrePayload = {
  type?: string;
  surface?: string;
  prixMensuel?: number;
  stock?: number;
};

/*
 * Publishes a cité that was described to someone rather than typed into the
 * admin form — a landlord sends five photos and a price over WhatsApp, and
 * they have to get in without the person holding the phone also holding a
 * laptop.
 *
 * Photos ride along in the same call and are uploaded here, so the storage
 * token stays inside the deployment, like the programme photograph and the
 * past papers.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const form = await request.formData();
  const champ = (nom: string) => (form.get(nom) ?? "").toString().trim();

  const nom = champ("nom");
  const quartier = champ("quartier");
  const distanceM = Number(champ("distance_m"));
  if (!nom || !quartier) {
    return NextResponse.json({ error: "nom et quartier sont obligatoires." }, { status: 400 });
  }
  if (!Number.isFinite(distanceM) || distanceM < 0) {
    return NextResponse.json({ error: "distance_m invalide." }, { status: 400 });
  }

  let brutes: ChambrePayload[];
  try {
    brutes = JSON.parse(champ("chambres") || "[]") as ChambrePayload[];
  } catch {
    return NextResponse.json({ error: "chambres n'est pas du JSON valide." }, { status: 400 });
  }

  const chambres = brutes
    .map((c) => ({
      type: (c.type ?? "").trim(),
      surface: (c.surface ?? "").trim(),
      prixMensuel: Math.round(Number(c.prixMensuel ?? 0)),
      stock: Math.max(0, Math.round(Number(c.stock ?? 0))),
    }))
    .filter((c) => c.type && c.prixMensuel > 0);

  // Same rule as the form: a cité with no priced room type cannot be sorted,
  // filtered or compared, so it is not a listing anyone can act on.
  if (chambres.length === 0) {
    return NextResponse.json(
      { error: "Au moins un type de chambre avec un prix est requis." },
      { status: 400 }
    );
  }

  const fichiers = form.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  const photos: string[] = [];
  for (const fichier of fichiers) {
    const uploaded = await uploadFile(fichier, "cites");
    photos.push(uploaded.url);
  }

  const [cite] = await db
    .insert(cites)
    .values({
      nom,
      quartier,
      distanceM: Math.round(distanceM),
      description: champ("description"),
      whatsapp: champ("whatsapp").replace(/[^0-9]/g, ""),
      photos,
    })
    .returning({ id: cites.id });

  await db
    .insert(roomTypes)
    .values(chambres.map((c, i) => ({ ...c, citeId: cite.id, sortOrder: i })));

  return NextResponse.json({ ok: true, id: cite.id, photos: photos.length });
}
