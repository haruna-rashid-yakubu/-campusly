import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jetonFichier } from "@/lib/jeton";
import { getRelatedSubjects, getSubjectById } from "@/lib/data";
import { entier, introuvable } from "@/lib/api";
import { masquerFichiers } from "@/lib/fichiers";

export async function GET(_: Request, ctx: RouteContext<"/api/v1/sujets/[id]">) {
  const id = entier((await ctx.params).id);
  const subject = id === null ? null : await getSubjectById(id);
  if (!subject) return introuvable();
  const [related, session] = await Promise.all([getRelatedSubjects(subject.id, subject.matiere, subject.filiere), auth()]);
  // Signed for the reader, since the app opens them in a browser that has no session (lib/jeton).
  const jeton = session?.user?.id ? jetonFichier(session.user.id) : undefined;
  return NextResponse.json({
    subject: masquerFichiers(subject, jeton),
    sameMatiere: related.sameMatiere.map((s) => masquerFichiers(s, jeton)),
    sameFiliere: related.sameFiliere.map((s) => masquerFichiers(s, jeton)),
  });
}
