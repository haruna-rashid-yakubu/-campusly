import { NextResponse } from "next/server";
import { entier, introuvable } from "@/lib/api";
import { getMaReponse, getResultats, getSondage } from "@/lib/sondage";

export const dynamic = "force-dynamic";

// The device's own answer comes from the X-Campusly-Device header.
export async function GET(_: Request, ctx: RouteContext<"/api/v1/sondages/[id]">) {
  const id = entier((await ctx.params).id);
  const sondage = id === null ? null : await getSondage(id);
  if (!sondage) return introuvable();
  const [resultats, maReponse] = await Promise.all([getResultats(sondage), getMaReponse(sondage.id)]);
  return NextResponse.json({ ...sondage, resultats, maReponse });
}
