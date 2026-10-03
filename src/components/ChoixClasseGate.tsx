import { cookies } from "next/headers";
import { ChoixClasseRequis } from "@/components/ChoixClasseRequis";
import { getClasses } from "@/lib/data";
import { CLASSE_COOKIE } from "@/lib/constants";

/*
 * Decides server-side whether the promo question still has to be asked, so a
 * device that has already answered never renders the screen at all — not even
 * for the frame it would take a client check to read the cookie.
 *
 * The cookie is read raw rather than through getPreferredClasse(), because
 * that one answers with the default promo when nothing is set, which is
 * precisely the state this screen exists to end.
 */
export async function ChoixClasseGate() {
  const store = await cookies();
  if (store.get(CLASSE_COOKIE)?.value) return null;

  // Only visitors who have not chosen pay for this query, and only until they
  // do. The shell deliberately avoids per-request work otherwise.
  const classes = await getClasses();
  return <ChoixClasseRequis classes={classes.map((c) => c.label)} />;
}
