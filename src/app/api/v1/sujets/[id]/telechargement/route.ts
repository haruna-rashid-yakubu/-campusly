import { NextResponse } from "next/server";
import { incrementSubjectDownload } from "@/lib/actions";
import { entier, introuvable } from "@/lib/api";

export async function POST(_: Request, ctx: RouteContext<"/api/v1/sujets/[id]/telechargement">) {
  const id = entier((await ctx.params).id);
  if (id === null) return introuvable();
  await incrementSubjectDownload(id);
  return new NextResponse(null, { status: 204 });
}
