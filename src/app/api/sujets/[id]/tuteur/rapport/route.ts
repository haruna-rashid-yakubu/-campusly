import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { evenements, subjects, users } from "@/db/schema";
import { lecteur, ouvrir } from "@/lib/acces";
import { reponseDeepSeek } from "@/lib/deepseek";
import { lireExtraction, texteBrut } from "@/lib/numerisation/lecture";
import { consignePartie, contexteRapport, partiesRapport, type ResultatQuiz } from "@/lib/rapport";
import { consigne, COURS_MAX } from "@/lib/tuteur";

/*
 * The revision report of a Sujet, written in parts at the same time
 * (lib/rapport): { etape: "plan" } starts a report — it is what the daily
 * limit counts — and answers with its parts; { partie } writes one of them.
 * The phone asks for all the parts at once, shows each as it arrives, then
 * has ./pdf print the whole.
 *
 * A part is only written within the two hours after its report was started.
 */
// The project runs on Fluid compute (up to 300 s): a heavy exercise reasons for a long while.
export const maxDuration = 300;

const RAPPORTS_JOUR = 5;
const HEURE = 60 * 60 * 1000;

type Corps = {
  etape?: "plan";
  partie?: string;
  messages?: { role: string; content: string }[];
  quiz?: ResultatQuiz[];
  corrige?: boolean;
  cours?: string;
};

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const numero = Number((await ctx.params).id);
  if (!Number.isInteger(numero) || numero <= 0) return new NextResponse(null, { status: 404 });

  const acces = await ouvrir(await lecteur(), numero);
  if (!acces.ok) return NextResponse.json({ erreur: acces.raison }, { status: acces.raison === "quota" ? 429 : 401 });

  const corps = ((await request.json().catch(() => null)) ?? {}) as Corps;
  const corrige = corps.corrige === true;
  const [sujet, extraction] = await Promise.all([
    db.select({ matiere: subjects.matiere, filiere: subjects.filiere, niveau: subjects.niveau, annee: subjects.annee, type: subjects.type }).from(subjects).where(eq(subjects.id, numero)),
    lireExtraction(numero, corrige).catch(() => null),
  ]);
  const s = sujet[0];
  if (!s || !extraction) return NextResponse.json({ erreur: "indisponible" }, { status: 404 });
  const parties = partiesRapport(extraction);

  const rapports = (depuis: number) =>
    db
      .select({ id: evenements.id })
      .from(evenements)
      .where(and(eq(evenements.type, "rapport_ia"), eq(evenements.userId, acces.userId), eq(evenements.cibleId, numero), gt(evenements.createdAt, new Date(Date.now() - depuis))));

  if (corps.etape === "plan") {
    const [compte] = await db.select({ role: users.role }).from(users).where(eq(users.id, acces.userId));
    if (compte?.role !== "admin") {
      const faits = await db
        .select({ id: evenements.id })
        .from(evenements)
        .where(and(eq(evenements.type, "rapport_ia"), eq(evenements.userId, acces.userId), gt(evenements.createdAt, new Date(Date.now() - 24 * HEURE))));
      if (faits.length >= RAPPORTS_JOUR) return NextResponse.json({ erreur: "quota_rapport", limite: RAPPORTS_JOUR }, { status: 429 });
    }
    await db.insert(evenements).values({ type: "rapport_ia", cible: "sujet", cibleId: numero, userId: acces.userId });
    return NextResponse.json({ parties });
  }

  const partie = parties.find((p) => p.id === corps.partie);
  if (!partie) return NextResponse.json({ erreur: "partie" }, { status: 400 });
  if (!(await rapports(2 * HEURE)).length) return NextResponse.json({ erreur: "plan" }, { status: 409 });

  const messages = (corps.messages ?? []).filter((m) => typeof m?.content === "string" && (m.role === "user" || m.role === "assistant"));
  const quiz = (corps.quiz ?? [])
    .filter((q) => Number.isFinite(q?.score) && Number.isFinite(q?.total))
    .slice(-10)
    .map((q) => ({ score: q.score, total: q.total, erreurs: (q.erreurs ?? []).slice(0, 8).map((e) => String(e).slice(0, 160)) }));
  const cours = typeof corps.cours === "string" ? corps.cours.slice(0, COURS_MAX) : "";
  // Only the end speaks of what the student did.
  const contexte = partie.id === "fin" ? contexteRapport(messages, quiz) : "";

  const reponse = await reponseDeepSeek(
    [
      { role: "system", content: consigne(s.matiere, `${s.type} · ${s.filiere} ${s.niveau} · ${s.annee}`, texteBrut(extraction), corrige, cours) },
      { role: "user", content: `${contexte ? `${contexte}\n\n` : ""}${consignePartie(partie, !!contexte)}` },
    ],
    // Reasoning included: a current-account exercise reasoned 6000 tokens and was cut off at 8000.
    20000
  );
  if (!reponse) return NextResponse.json({ erreur: "ia" }, { status: 502 });
  return NextResponse.json(reponse);
}
