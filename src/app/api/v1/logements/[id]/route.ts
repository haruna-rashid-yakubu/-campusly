import { NextResponse } from "next/server";
import { getCiteById } from "@/lib/data";
import { entier, introuvable } from "@/lib/api";

export async function GET(_: Request, ctx: RouteContext<"/api/v1/logements/[id]">) {
  const id = entier((await ctx.params).id);
  const cite = id === null ? null : await getCiteById(id);
  if (!cite) return introuvable();
  return NextResponse.json(cite);
}
