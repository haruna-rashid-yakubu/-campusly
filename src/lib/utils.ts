export function fcfa(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

export function distanceLabel(m: number): string {
  return m >= 1000 ? (m / 1000).toFixed(1).replace(".", ",") + " km" : m + " m";
}

export function roomStockLabel(n: number): string {
  if (n === 0) return "Complet";
  return n + (n > 1 ? " chambres restantes" : " chambre restante");
}

export function citeAvailabilityLabel(n: number): string {
  if (n === 0) return "Complet";
  return n + (n > 1 ? " chambres disponibles" : " chambre disponible");
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isWithinLastWeek(date: Date): boolean {
  return Date.now() - date.getTime() < WEEK_MS;
}
