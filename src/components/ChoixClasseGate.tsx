import { cookies } from "next/headers";
import { auth } from "@/auth";
import { Bienvenue } from "@/components/Bienvenue";
import { getClasses } from "@/lib/data";
import { getProfilCourant } from "@/lib/actions";
import { CLASSE_COOKIE, ONBOARDING_COOKIE } from "@/lib/constants";

/*
 * Decides server-side whether the welcome flow still has to be shown, so a
 * device that has answered never renders it at all.
 *
 * Without a promo it starts from the promo question, which cannot be skipped.
 * A device that chose its promo before the flow existed gets the name and
 * WhatsApp steps once, unless it already gave a first name. The cookies are
 * read first: a device that has finished pays for no query.
 *
 * The class cookie is read raw rather than through getPreferredClasse(),
 * because that one answers with the default promo when nothing is set.
 */
export async function ChoixClasseGate() {
  const store = await cookies();
  const aClasse = !!store.get(CLASSE_COOKIE)?.value;
  if (aClasse && store.get(ONBOARDING_COOKIE)?.value) return null;

  const [classes, session, profil] = await Promise.all([getClasses(), auth(), getProfilCourant()]);
  if (aClasse && profil.prenom) return null;

  const [prenomGoogle, ...reste] = (session?.user?.name ?? "").trim().split(/\s+/);
  return (
    <Bienvenue
      classes={classes.map((c) => c.label)}
      depart={aClasse ? "nom" : "classe"}
      prenomGoogle={profil.prenom ?? (prenomGoogle || null)}
      nomGoogle={profil.nom ?? (reste.join(" ") || null)}
      connecte={!!session?.user}
    />
  );
}
