/*
 * A shop sells "by the unit" when its only formule is a single item: a
 * bottle, a plate. There is then no pack to choose and fill — the student
 * says how many of each flavour, and the order is one line. Shared by the
 * page and the server, so both read the catalogue the same way.
 */
export const MAX_UNITES = 30;

export function venteALUnite(formules: { taille: number }[]) {
  return formules.length === 1 && formules[0].taille === 1;
}
