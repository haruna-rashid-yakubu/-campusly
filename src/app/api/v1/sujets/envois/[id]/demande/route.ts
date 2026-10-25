import { NextResponse } from "next/server";
import { demanderDocument } from "@/lib/actions";
import { corps, entier, introuvable } from "@/lib/api";

export async function POST(request: Request, ctx: RouteContext<"/api/v1/sujets/envois/[id]/demande">) {
  const id = entier((await ctx.params).id);
  if (id === null) return introuvable();
  const body = await corps<{ message?: string }>(request);
  return NextResponse.json(await demanderDocument(id, body?.message));
}
