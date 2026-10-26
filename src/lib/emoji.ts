/*
 * Emoji written into the data — a shop's menu ("🛵 Livraison"), a poll's
 * options, the pressing conditions — shown as the app's own line icons rather
 * than as emoji. The table is the same in the web app and the mobile app.
 */

export const ICONE_EMOJI = {
  "🍽": "utensils",
  "🥡": "takeaway",
  "🛵": "scooter",
  "🍗": "drumstick",
  "🍖": "drumstick",
  "🍟": "fries",
  "🍦": "icecream",
  "🍨": "icecream",
  "🥤": "cup",
  "🧃": "cup",
  "🍹": "cup",
  "☕": "coffee",
  "🔥": "flame",
  "🚚": "truck",
  "🎁": "gift",
  "📍": "pin",
  "🍩": "donut",
  "🧺": "shirt",
  "👕": "shirt",
  "💰": "wallet",
  "💳": "card",
  "📋": "list",
  "🔁": "refresh",
  "⚪": "drop",
  "🧼": "drop",
  "⚠": "warn",
  "📣": "megaphone",
  "📦": "package",
  "🎀": "heart",
  "❤": "heart",
  "📅": "cal",
  "🔔": "bell",
  "✓": "check",
  "✅": "check",
  "🌆": "sun",
  "🌙": "moon",
  "⭐": "star",
  "✨": "star",
  "🏷": "tag",
} as const;

export type IconeEmoji = (typeof ICONE_EMOJI)[keyof typeof ICONE_EMOJI];

// Code-unit ranges rather than \p{…}: the mobile app's engine (Hermes) has no Unicode classes.
const UNE = "(?:[\\u2190-\\u2BFF]|[\\uD83C-\\uD83E][\\uDC00-\\uDFFF])";
const SEQUENCE = `${UNE}(?:\\uFE0F|\\u200D${UNE})*`;
const EN_TETE = new RegExp(`^\\s*(${SEQUENCE})\\s*`);
const PARTOUT = new RegExp(`${SEQUENCE}\\s?`, "g");

// The clock faces 🕐 … 🕧, whatever hour they show.
function horloge(e: string) {
  const c = e.codePointAt(0) ?? 0;
  return c >= 0x1f550 && c <= 0x1f567;
}

/** "🛵 Livraison 500 F" → { icone: "scooter", texte: "Livraison 500 F" }. Unknown emoji are dropped. */
export function separerEmoji(texte: string): { icone: IconeEmoji | "clock" | null; texte: string } {
  const m = texte.match(EN_TETE);
  if (!m) return { icone: null, texte };
  const base = m[1].replace(/️/g, "").split("‍")[0];
  const icone = horloge(base) ? "clock" : ((ICONE_EMOJI as Record<string, IconeEmoji>)[base] ?? null);
  return { icone, texte: texte.slice(m[0].length) };
}

/** Removes every emoji, for text shown without an icon. */
export function sansEmoji(texte: string) {
  return texte.replace(PARTOUT, "").trim();
}
