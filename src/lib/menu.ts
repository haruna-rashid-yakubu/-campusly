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

import type { CSSProperties } from "react";

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
// gamelle: the dishes leave in a box, charged per dish (takeaway, delivery — not eating in).
export type ModeRemise = { id: string; libelle: string; prix: number; detail?: string; gamelle?: boolean };
/*
 * A shop's own colours for its page, so a chicken shop does not wear the
 * donut shop's pink and black: accent for the buttons and what is picked,
 * fonce for its name and figures, doux and bord for the soft panels.
 */
export type Theme = { accent: string; fonce: string; doux: string; bord: string };
export type Menu = {
  sections: SectionMenu[];
  theme?: Theme;
  // Per dish, for the box it leaves in, when the way it is handed over needs one.
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
  return { sections, modes, gamelle: Number.isInteger(m.gamelle) ? (m.gamelle as number) : 0, theme: lireTheme(m.theme) };
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// The colours end up in a style attribute: only plain hex gets through.
function lireTheme(brut: unknown): Theme | undefined {
  const t = brut as Partial<Theme> | null | undefined;
  if (!t) return undefined;
  const { accent, fonce, doux, bord } = t;
  if (![accent, fonce, doux, bord].every((c) => typeof c === "string" && HEX.test(c))) return undefined;
  return { accent: accent!, fonce: fonce!, doux: doux!, bord: bord! };
}

/** The theme as CSS variables, read by the shop page's pieces with their usual colours as fallback. */
export function variablesTheme(theme?: Theme) {
  if (!theme) return undefined;
  return {
    "--v-accent": theme.accent,
    "--v-fonce": theme.fonce,
    "--v-doux": theme.doux,
    "--v-bord": theme.bord,
  } as CSSProperties;
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
