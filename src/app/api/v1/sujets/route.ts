import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { proposeSubject } from "@/lib/actions";
import { getPreferredClasse, getSubjectFacets, getSubjectsPage, getUserSubmissions } from "@/lib/data";
import { filiereDeClasse, niveauDeClasse } from "@/lib/utils";
import { masquerFichiers } from "@/lib/fichiers";
import { jetonFichier } from "@/lib/jeton";

export const dynamic = "force-dynamic";

const PAGE = 20;

/*
 * Opens on the student's own filière unless asked for ?filiere=toutes, and
 * their own year first, as the page does. Paged with ?limit=&offset=.
 */
export async function GET(request: NextRequest) {
  const { limit, offset, ...params } = Object.fromEntries(request.nextUrl.searchParams);
  const [session, classe] = await Promise.all([auth(), getPreferredClasse()]);
  const filiere = params.filiere === "toutes" ? undefined : params.filiere || filiereDeClasse(classe);
  // Only when the list is not already narrowed to one year.
  const niveauPrefere = params.niveau ? undefined : niveauDeClasse(classe) || undefined;
  const taille = Math.min(Math.max(Number(limit) || PAGE, 1), 100);
  const debut = Math.max(Number(offset) || 0, 0);
  const [page, submissions, facets] = await Promise.all([
    getSubjectsPage({ ...params, filiere }, { limit: taille, offset: debut, niveauPrefere }),
    session?.user?.id ? getUserSubmissions(session.user.id) : Promise.resolve([]),
    getSubjectFacets(),
  ]);
  // Signed for the reader, since the app opens them in a browser that has no session (lib/jeton).
  const jeton = session?.user?.id ? jetonFichier(session.user.id) : undefined;
  return NextResponse.json({
    filiere: filiere ?? null,
    niveauPrefere: niveauPrefere ?? null,
    subjects: page.subjects.map((s) => masquerFichiers(s, jeton)),
    total: page.total,
    offset: debut,
    limit: taille,
    submissions,
    facets,
  });
}

// Proposing a paper: multipart with the web form's fields (fileUrl from a blob upload).
export async function POST(request: Request) {
  return NextResponse.json(await proposeSubject(await request.formData()));
}
