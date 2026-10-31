import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TYPES_ACCEPTES, uploadFile } from "@/lib/envois";

export const dynamic = "force-dynamic";

/*
 * Receives a file from the browser and keeps it in R2 (lib/envois); the form
 * then sends only its address to the action that writes the row.
 *
 * On Vercel the file had to go round the server: a function's body was
 * capped at 4.5 MB, which a three-page paper already passed. A Worker takes
 * far more, so the file comes here, whole, in one request.
 *
 * Being signed in is the whole of the right, because it is also the whole of
 * the right to send a paper at all: a student proposing one goes through here
 * too. What matters is checked where it counts — when the row is written,
 * against the promo and the role — because accepting a file says who may
 * send one, never what may be claimed afterwards.
 */
const DOSSIERS = ["submissions", "sujets"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const data = await request.formData().catch(() => null);
  const fichier = data?.get("fichier");
  const dossier = String(data?.get("dossier") ?? "");
  if (!(fichier instanceof File) || fichier.size === 0 || !DOSSIERS.includes(dossier)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (!TYPES_ACCEPTES.includes(fichier.type)) {
    return NextResponse.json({ error: "Seuls les photos et les PDF sont acceptés." }, { status: 400 });
  }

  try {
    return NextResponse.json(await uploadFile(fichier, dossier));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Envoi refusé" }, { status: 400 });
  }
}
