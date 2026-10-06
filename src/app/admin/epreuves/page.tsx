import type { Metadata } from "next";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { EmptyState } from "@/components/EmptyState";
import { EpreuvesEnLotForm } from "@/components/admin/EpreuvesEnLotForm";
import { getClasseLabels, getClasses, getPreferredClasse, getProposerFacets } from "@/lib/data";
import { subjectTypeEnum } from "@/db/schema";

export const metadata: Metadata = {
  title: "Ajouter des épreuves",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/*
 * Publishing a stack of papers rather than one.
 *
 * Open to délégués, not only to admins: they are the ones holding the cupboard
 * key, and the promo list they are given here is their own, so the fence is
 * the same one that guards everything else they can do.
 */
export default async function EpreuvesEnLotPage() {
  const session = await auth();
  if (!session?.user) return <SignInRequired backHref="/admin" title="Ajouter des épreuves" />;

  const estAdmin = session.user.role === "admin";
  const mesPromos = estAdmin
    ? (await getClasses()).map((c) => c.label)
    : (await getClasseLabels(session.user.delegations ?? [])).map((c) => c.label);

  if (mesPromos.length === 0) {
    return (
      <div className="min-h-dvh">
        <BackHeader title="Ajouter des épreuves" fallbackHref="/admin" border />
        <EmptyState
          icon="lock"
          title="Réservé à l'équipe Campusly"
          body="Ton compte n'est délégué d'aucune promo."
        />
      </div>
    );
  }

  const [preferee, facets] = await Promise.all([getPreferredClasse(), getProposerFacets()]);

  return (
    <div className="min-h-dvh">
      <BackHeader title="Ajouter des épreuves" fallbackHref="/admin" border />
      <EpreuvesEnLotForm
        classes={mesPromos}
        defaultClasse={preferee}
        types={subjectTypeEnum}
        matieres={facets.matiere}
        annees={facets.annee}
      />
    </div>
  );
}
