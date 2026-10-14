/*
 * A restaurant's menu, as stored on the shop. Each item has its sizes and
 * their prices, and may ask for one choice (the side with the chicken, the
 * flavour of an ice cream). Dishes are flagged: they carry the takeaway box
 * fee and count for the weekly loyalty card; an ice cream does neither.
 *
 * Read with lireMenu everywhere, page and server alike: a malformed menu in
 * the database must not break the page, and the server only ever prices an
 * order from what this returns.
 */

export type Taille = { id: string; nom: string; prix: number };
export type ItemMenu = {
  id: string;
  nom: string;
  description?: string;
  photo?: string;
  tailles: Taille[];
  choix?: { titre: string; options: string[] };
  plat?: boolean;
};
export type SectionMenu = { titre: string; items: ItemMenu[] };
export type ModeRemise = { id: string; libelle: string; prix: number; detail?: string };
export type Menu = {
  sections: SectionMenu[];
  // Per dish, for the box it leaves in.
  gamelle: number;
  modes: ModeRemise[];
};

/** One line of a basket, as the page sends it. */
export type LigneMenu = { item: string; taille: string; choix?: string; quantite: number };

export const MAX_PAR_LIGNE = 20;
export const MAX_LIGNES = 20;

export function lireMenu(brut: unknown): Menu | null {
  const m = brut as Partial<Menu> | null | undefined;
  if (!m || !Array.isArray(m.sections) || !Array.isArray(m.modes) || m.modes.length === 0) return null;
  const sections = m.sections
    .map((s) => ({
      titre: String(s?.titre ?? ""),
      items: (Array.isArray(s?.items) ? s.items : []).filter(
        (i): i is ItemMenu =>
          !!i &&
          typeof i.id === "string" &&
          typeof i.nom === "string" &&
          Array.isArray(i.tailles) &&
          i.tailles.length > 0 &&
          i.tailles.every((t) => typeof t?.id === "string" && Number.isInteger(t?.prix) && t.prix > 0)
      ),
    }))
    .filter((s) => s.items.length > 0);
  const modes = m.modes.filter(
    (x): x is ModeRemise => !!x && typeof x.id === "string" && typeof x.libelle === "string" && Number.isInteger(x.prix)
  );
  if (sections.length === 0 || modes.length === 0) return null;
  return { sections, modes, gamelle: Number.isInteger(m.gamelle) ? (m.gamelle as number) : 0 };
}

export function trouverItem(menu: Menu, id: string) {
  for (const s of menu.sections) {
    const i = s.items.find((x) => x.id === id);
    if (i) return i;
  }
  return null;
}

/** "Poulet pané (Moyen) · Frites de plantain" */
export function libelleLigne(item: ItemMenu, taille: Taille, choix?: string) {
  const t = item.tailles.length > 1 ? ` (${taille.nom})` : "";
  return `${item.nom}${t}${choix ? ` · ${choix}` : ""}`;
}

/** The lowest price on the menu, for "à partir de". */
export function prixMin(menu: Menu) {
  return Math.min(...menu.sections.flatMap((s) => s.items.flatMap((i) => i.tailles.map((t) => t.prix))));
}
