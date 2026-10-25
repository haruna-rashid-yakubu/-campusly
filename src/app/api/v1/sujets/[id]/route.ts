import { NextResponse } from "next/server";
import { getRelatedSubjects, getSubjectById } from "@/lib/data";
import { entier, introuvable } from "@/lib/api";

export async function GET(_: Request, ctx: RouteContext<"/api/v1/sujets/[id]">) {
  const id = entier((await ctx.params).id);
  const subject = id === null ? null : await getSubjectById(id);
  if (!subject) return introuvable();
  const related = await getRelatedSubjects(subject.id, subject.matiere, subject.filiere);
  return NextResponse.json({ subject, ...related });
}
