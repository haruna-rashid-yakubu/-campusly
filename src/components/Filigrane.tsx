/*
 * The reader's name across what they are reading, faint and repeated: on a
 * Sujet's text and photos, the PDF reader and the tutor. It does not get in
 * the way of reading; it is in every capture, and says whose screen it was.
 */
export function Filigrane({ texte, sombre = false }: { texte: string; sombre?: boolean }) {
  const t = texte.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='190'><text x='180' y='100' text-anchor='middle' transform='rotate(-22 180 95)' font-family='Manrope, sans-serif' font-size='13' font-weight='700' fill='${sombre ? "#ffffff" : "#0f172a"}'>${t}</text></svg>`;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[60] select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        opacity: sombre ? 0.12 : 0.09,
      }}
    />
  );
}
