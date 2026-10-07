/*
 * A link to one precise thing — this past paper, this cité — as opposed to a
 * section of the app. These are what students actually send each other, so
 * whoever follows one arrived wanting that page and nothing else.
 *
 * Matched on a numeric id so that the named routes under the same prefix
 * (/sujets/proposer, /sujets/mes-envois) are not mistaken for shared items.
 */
export function estUnLienPartage(pathname: string): boolean {
  return /^\/(sujets|logements)\/\d+$/.test(pathname);
}

/*
 * Pages whose content is the same whoever is reading.
 *
 * The promo question exists because a device that never answered was being
 * shown another promo's timetable as if it were its own — of 39 devices in a
 * day, 36 had never chosen. That is a real harm, and it is why the screen has
 * no close button.
 *
 * But it is a harm these pages cannot cause. The pressing is one service at a
 * fixed price, and the list of cités is the same for every student on campus:
 * asking someone their promo to show them something that does not depend on
 * it is a wall for nothing. It matters most for the one case these links are
 * made for — a sheet taped up at the laundry, scanned by someone who has
 * never opened Campusly and wants a price, not a questionnaire.
 *
 * The question is not dropped, only deferred: it is asked the moment they
 * touch Accueil, Sujets or Programme, which is where a wrong promo would
 * actually show them the wrong thing.
 */
export function neDependPasDeLaPromo(pathname: string): boolean {
  return pathname === "/pressing" || pathname === "/logements";
}

export function hasTabBar(pathname: string): boolean {
  if (pathname === "/sujets/proposer") return false;
  if (pathname === "/programme/proposer") return false;
  if (pathname.endsWith("/plein")) return false;
  if (pathname.startsWith("/installer")) return false;
  if (pathname.startsWith("/admin")) return false;
  return true;
}
