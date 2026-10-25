import { NextResponse } from "next/server";
import { repondreSondage } from "@/lib/actions";
import { corps, entier, introuvable, invalide } from "@/lib/api";

export async function POST(request: Request, ctx: RouteContext<"/api/v1/sondages/[id]/reponse">) {
  const id = entier((await ctx.params).id);
  if (id === null) return introuvable();
  const body = await corps<{ option?: number }>(request);
  if (typeof body?.option !== "number") return invalide();
  return NextResponse.json(await repondreSondage(id, body.option));
}
