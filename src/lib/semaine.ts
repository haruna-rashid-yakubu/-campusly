import { JOURS } from "@/lib/constants";

/*
 * Everything here works on a week identified by its Monday, at midnight local
 * time. The school numbers its own weeks ("Semaine 25") and that label is kept
 * for display, but it says nothing about what day tomorrow is — so the Monday
 * is what the database stores and what every lookup keys on.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** The Monday of the week containing `d`. Sunday belongs to the week before. */
export function mondayOf(d: Date) {
  const day = startOfDay(d);
  // getDay(): 0 = Sunday. Shifting by 6 puts Sunday at the end of its week
  // rather than the start of the next one, which is how a timetable reads.
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY_MS);
}

export function addDays(d: Date, n: number) {
  return new Date(startOfDay(d).getTime() + n * DAY_MS);
}

/** 1 = Monday … 6 = Saturday, matching `creneau.jour`. Sunday gives 7. */
export function jourOf(d: Date) {
  return ((d.getDay() + 6) % 7) + 1;
}

export function jourLabel(jour: number) {
  return JOURS[jour - 1] ?? "";
}

/** "du 4 au 9 mai" — the same shape the noticeboard uses. */
export function weekRangeLabel(monday: Date) {
  const saturday = addDays(monday, 5);
  const sameMonth = monday.getMonth() === saturday.getMonth();
  const day = (d: Date) => d.getDate();
  const month = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long" });
  return sameMonth
    ? `du ${day(monday)} au ${day(saturday)} ${month(saturday)}`
    : `du ${day(monday)} ${month(monday)} au ${day(saturday)} ${month(saturday)}`;
}

/** yyyy-mm-dd in local time — `toISOString()` would shift the day in UTC+1. */
export function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
