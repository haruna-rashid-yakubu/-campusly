import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { evenements } from "@/db/schema";
import { lecteur, ouvrir } from "@/lib/acces";
import { consigneTranscription } from "@/lib/tuteur";

/*
 * One page of a student's course — a photograph, or a scanned PDF page drawn
 * on the phone — turned into text for the revision tutor. A PDF with text in
 * it never comes here: the phone reads it itself.
 *
 * The text goes back to the phone, which keeps it with the conversation;
 * nothing is stored here. PAGES_JOUR pages a day per account.
 */
export const maxDuration = 60;

const PAGES_JOUR = 40;
const TAILLE_MAX = 3 * 1024 * 1024;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const numero = Number((await ctx.params).id);
  if (!Number.isInteger(numero) || numero <= 0) return new NextResponse(null, { status: 404 });

  const acces = await ouvrir(await lecteur(), numero);
  if (!acces.ok) return NextResponse.json({ erreur: acces.raison }, { status: acces.raison === "quota" ? 429 : 401 });

  const image = (await request.formData().catch(() => null))?.get("page");
  if (!(image instanceof File) || !image.type.startsWith("image/") || image.size > TAILLE_MAX) {
    return NextResponse.json({ erreur: "image" }, { status: 400 });
  }

  const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const faites = await db
    .select({ id: evenements.id })
    .from(evenements)
    .where(and(eq(evenements.type, "page_cours_ia"), eq(evenements.userId, acces.userId), gt(evenements.createdAt, depuis)));
  if (faites.length >= PAGES_JOUR) return NextResponse.json({ erreur: "quota_cours", limite: PAGES_JOUR }, { status: 429 });

  const cle = process.env.DEEPSEEK_API_KEY;
  if (!cle) return NextResponse.json({ erreur: "indisponible" }, { status: 503 });

  const donnees = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`;
  const reponse = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-flash",
      max_tokens: 4000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: consigneTranscription() },
            { type: "image_url", image_url: { url: donnees } },
          ],
        },
      ],
    }),
  }).catch(() => null);
  if (!reponse?.ok) return NextResponse.json({ erreur: "ia" }, { status: 502 });

  const d = (await reponse.json()) as { choices?: { message?: { content?: string } }[] };
  const texte = d.choices?.[0]?.message?.content?.trim() ?? "";
  if (!texte) return NextResponse.json({ erreur: "ia" }, { status: 502 });

  await db.insert(evenements).values({ type: "page_cours_ia", cible: "sujet", cibleId: numero, userId: acces.userId });
  return NextResponse.json({ texte });
}
