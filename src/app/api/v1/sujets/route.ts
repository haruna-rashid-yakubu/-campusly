import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { proposeSubject } from "@/lib/actions";
import { getPreferredClasse, getSubjectFacets, getSubjects, getUserSubmissions } from "@/lib/data";
import { filiereDeClasse } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Opens on the student's own filière unless asked for ?filiere=toutes, as the page does.
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const [session, classe] = await Promise.all([auth(), getPreferredClasse()]);
  const filiere = params.filiere === "toutes" ? undefined : params.filiere || filiereDeClasse(classe);
  const [subjects, submissions, facets] = await Promise.all([
    getSubjects({ ...params, filiere }),
    session?.user?.id ? getUserSubmissions(session.user.id) : Promise.resolve([]),
    getSubjectFacets(),
  ]);
  return NextResponse.json({ filiere: filiere ?? null, subjects, submissions, facets });
}

// Proposing a paper: multipart with the web form's fields (fileUrl from a blob upload).
export async function POST(request: Request) {
  return NextResponse.json(await proposeSubject(await request.formData()));
}
