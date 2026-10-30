import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { evenements, subjects, users } from "@/db/schema";
import { lecteur, ouvrir } from "@/lib/acces";
import { lireExtraction, texteBrut } from "@/lib/numerisation/lecture";
import { consigne, COURS_MAX } from "@/lib/tuteur";
import { fluxDeepSeek } from "@/lib/deepseek";

/*
 * The revision tutor of a Sujet: a conversation with DeepSeek, which has the
 * whole paper in front of it. It teaches rather than answers — the notion,
 * the method, the steps — and gives a final result only when asked for it.
 *
 * For a signed-in account allowed to read the Sujet (lib/acces), within
 * QUOTA_IA questions a day; the answer is streamed as plain text.
 */
export const maxDuration = 60;

const QUOTA_IA = 30;
const JOUR = 24 * 60 * 60 * 1000;
const HISTORIQUE = 12;

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const numero = Number((await ctx.params).id);
  if (!Number.isInteger(numero) || numero <= 0) return new NextResponse(null, { status: 404 });

  const acces = await ouvrir(await lecteur(), numero);
  if (!acces.ok) return NextResponse.json({ erreur: acces.raison }, { status: acces.raison === "quota" ? 429 : 401 });

  const corps = (await request.json().catch(() => null)) as { messages?: Message[]; corrige?: boolean; cours?: string } | null;
  // The student's course, already text (read on the phone, or transcribed by ./cours).
  const cours = typeof corps?.cours === "string" ? corps.cours.slice(0, COURS_MAX) : "";
  const messages = (corps?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-HISTORIQUE)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (messages.at(-1)?.role !== "user") return NextResponse.json({ erreur: "message" }, { status: 400 });

  // The day's questions, admins aside.
  const [compte] = await db.select({ role: users.role }).from(users).where(eq(users.id, acces.userId));
  if (compte?.role !== "admin") {
    const depuis = new Date(Date.now() - JOUR);
    const poses = await db
      .select({ id: evenements.id })
      .from(evenements)
      .where(and(eq(evenements.type, "message_ia"), eq(evenements.userId, acces.userId), gt(evenements.createdAt, depuis)));
    if (poses.length >= QUOTA_IA) return NextResponse.json({ erreur: "quota_ia", limite: QUOTA_IA }, { status: 429 });
  }

  const corrige = corps?.corrige === true;
  const [sujet, extraction] = await Promise.all([
    db.select({ matiere: subjects.matiere, filiere: subjects.filiere, niveau: subjects.niveau, annee: subjects.annee, type: subjects.type }).from(subjects).where(eq(subjects.id, numero)),
    lireExtraction(numero, corrige).catch(() => null),
  ]);
  const s = sujet[0];
  if (!s || !extraction) return NextResponse.json({ erreur: "indisponible" }, { status: 404 });

  const texte = await fluxDeepSeek(
    [
      { role: "system", content: consigne(s.matiere, `${s.type} · ${s.filiere} ${s.niveau} · ${s.annee}`, texteBrut(extraction), corrige, cours) },
      ...messages,
    ],
    // Its reasoning counts in here too: a quiz was cut off at 2500.
    6000
  );
  if (!texte) return NextResponse.json({ erreur: "ia" }, { status: 502 });

  await db.insert(evenements).values({ type: "message_ia", cible: "sujet", cibleId: numero, userId: acces.userId });
  return new Response(texte, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
