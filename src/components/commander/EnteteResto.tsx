import type { Theme } from "@/lib/menu";

/*
 * A restaurant's header: its name large on its own colours, over small line
 * drawings of what it cooks — a drumstick, a chilli, a cone of fries — so the
 * page reads as a place to eat before a word of it is read.
 *
 * The drawings are one tile, repeated, drawn in the cream of the text at low
 * strength: texture, not decoration to look at.
 *
 * Once the shop has a photo of its own food, the photo is the header: the
 * drawings make way, and the shop's colours run over it from the side the
 * text sits on, so the name stays readable on any picture.
 */
const MOTIF = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150' fill='none' stroke='#fff3d6' stroke-opacity='.32' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>
    <path d='M22 46c-9-9-6-26 8-29 13-3 25 7 23 20-1 6-5 10-9 13l-7 5c-6 3-11-4-15-9z'/>
    <path d='M42 52l13 13'/><circle cx='58' cy='63' r='3.5'/><circle cx='53' cy='68' r='3.5'/>
    <path d='M104 18c3-4 8-5 11-3M108 22c10 6 11 22 2 35-7 10-18 15-27 14 12-8 20-20 21-33 0-6 1-12 4-16z'/>
    <path d='M28 104l6 32h20l6-32z'/><path d='M33 104l-3-16M40 104v-19M47 104l2-17M54 104l5-14'/>
    <path d='M104 98l6 10 11 2-8 8 2 11-11-5-10 5 2-11-8-8 11-2z'/>
    <circle cx='126' cy='68' r='2'/><circle cx='80' cy='132' r='2'/><circle cx='86' cy='40' r='2'/>
  </svg>`
)}") 0 0/150px 150px`;

export function EnteteResto({
  nom,
  accroche,
  theme,
  fond,
  photo,
  icone,
}: {
  nom: string;
  accroche: string | null;
  theme: Theme;
  fond: string | null;
  photo?: string | null;
  icone?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[26px] px-5 pb-5 pt-4 text-white shadow-[0_12px_30px_rgba(196,42,28,.28)]"
      style={{
        background: photo
          ? `linear-gradient(100deg, ${theme.fonce}f2 0%, ${theme.accent}cc 42%, ${theme.accent}33 75%, transparent 100%), url("${photo}") center/cover`
          : `${MOTIF}, ${fond ?? theme.accent}`,
      }}
    >
      {icone && !photo && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-5 -right-5 rotate-[-14deg] text-[110px] leading-none drop-shadow-[0_10px_14px_rgba(80,20,5,.35)]"
        >
          {icone}
        </span>
      )}
      {theme.accroche && (
        <span className="inline-flex h-7 items-center rounded-full bg-white/22 px-3 text-[12.5px] font-extrabold backdrop-blur-sm">
          {theme.accroche}
        </span>
      )}
      <div className="mt-2.5 text-[44px] font-extrabold leading-[.95] tracking-tight [text-shadow:0_3px_0_rgba(110,20,5,.35)]">
        {nom}
      </div>
      {accroche && (
        <div className="mt-2 max-w-[215px] text-[14.5px] font-semibold leading-snug text-white/95">{accroche}</div>
      )}
      {theme.badges && theme.badges.length > 0 && (
        <div className="relative z-10 mt-4 flex max-w-[250px] flex-wrap gap-1.5">
          {theme.badges.map((b) => (
            <span
              key={b}
              className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12.5px] font-extrabold"
              style={{ color: theme.fonce }}
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
