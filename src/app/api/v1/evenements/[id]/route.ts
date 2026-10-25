import { NextResponse } from "next/server";
import { introuvable } from "@/lib/api";
import { getEvenement } from "@/lib/evenements";

export async function GET(_: Request, ctx: RouteContext<"/api/v1/evenements/[id]">) {
  const evenement = getEvenement((await ctx.params).id);
  return evenement ? NextResponse.json(evenement) : introuvable();
}
