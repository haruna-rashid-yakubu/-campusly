import Link from "next/link";
import { auth } from "@/auth";
import { Icon } from "@/components/icons";
import { SujetsFilterBar } from "@/components/SujetsFilterBar";
import {
  getPreferredClasse,
  getSubjectFacets,
  getUserSubmissions,
} from "@/lib/data";
import { filiereDeClasse } from "@/lib/utils";

/*
 * The list's frame: its title and the search, which stay put while the
 * results change underneath. In the page, they were re-rendered with every
 * search — the loading screen replaced them for a moment, the field lost its
 * focus and the keyboard closed between two letters. A layout is not
 * rendered again when only the search parameters change.
 */
export default async function SujetsListeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, classe, facets] = await Promise.all([
    auth(),
    getPreferredClasse(),
    getSubjectFacets(),
  ]);
  const submissions = session?.user
    ? await getUserSubmissions(session.user.id)
    : [];
  const hasPending = submissions.some((s) => s.status === "en_attente");
  const filiereDefaut = filiereDeClasse(classe);

  return (
    <div className="cy-large group/liste relative min-h-dvh pb-[calc(92px+var(--safe-bottom))] lg:pb-10">
      <div
        className="sticky top-0 z-10 bg-white px-5"
        style={{ paddingTop: "calc(20px + var(--safe-top))" }}
      >
        <div className="flex items-center gap-2.5 pb-1">
          <div className="flex-1 whitespace-nowrap text-[24px] font-extrabold tracking-tight">
            Anciens sujets
          </div>
          <Link
            href="/sujets/mes-envois"
            className="press-scale relative grid h-11 w-11 place-items-center rounded-[14px] border-[1.5px] border-line active:bg-surface-2"
            aria-label="Mes envois"
          >
            <Icon name="inbox" size={21} strokeWidth={1.8} />
            {hasPending && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal" />
            )}
          </Link>
          <Link
            href="/sujets/proposer"
            className="press-scale grid h-11 w-11 place-items-center rounded-[14px] bg-teal text-white active:bg-teal-press"
            aria-label="Proposer un sujet"
          >
            <Icon name="plus" size={20} strokeWidth={2.2} />
          </Link>
        </div>
        <SujetsFilterBar
          facets={facets}
          defaults={{ filiere: filiereDefaut }}
        />
      </div>

      {children}
    </div>
  );
}
