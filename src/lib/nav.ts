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

export function hasTabBar(pathname: string): boolean {
  if (pathname === "/sujets/proposer") return false;
  if (pathname.endsWith("/plein")) return false;
  if (pathname.startsWith("/installer")) return false;
  if (pathname.startsWith("/admin")) return false;
  return true;
}
