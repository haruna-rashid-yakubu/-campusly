/*
 * The shape of one box in the weekly grid, and the keys that address it.
 *
 * These live here rather than beside the form because both sides need them:
 * the client component renders the grid, and the admin page fills it from the
 * database before handing it over. They used to be exported from the form
 * itself, which is a "use client" module — and every export of such a module
 * becomes an opaque client reference on the server, so calling cellKey()
 * while rendering the page threw instead of returning a string.
 *
 * That fault stayed invisible for as long as the current week had no
 * programme: the loop that calls these runs once per créneau, so an empty
 * week never called them. It surfaced the moment all twelve promos had a
 * timetable published for the week on screen.
 */
export type Cell = {
  matiere: string;
  /*
   * The hour written on the sheet, when the noticeboard announced something
   * outside the usual two-hour blocks. Empty means the slot's own hours are
   * right, which is the normal case.
   */
  horaire: string;
  abrege: string;
  enseignant: string;
  salle: string;
  seance: string;
  seances: string;
  cc: boolean;
};

export const cellKey = (jour: number, debut: number) => `${jour}-${debut}`;

export const halfKey = (jour: number, moment: string) => `${jour}-${moment}`;
