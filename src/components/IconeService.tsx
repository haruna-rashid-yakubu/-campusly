/*
 * The home screen's service icons: drawn for it, in two tones — the shape
 * tinted, its outline and details in the service's colour — so each reads at
 * a glance as what it is (a paper with the tutor's spark, a calendar, a
 * house, a shirt, a bag) and all five look like one family.
 */
export type Service = "sujets" | "programme" | "logements" | "pressing" | "commander";

export function IconeService({ service, couleur, taille = 30 }: { service: Service; couleur: string; taille?: number }) {
  const trait = { stroke: couleur, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const teinte = { fill: couleur, fillOpacity: 0.16 };
  return (
    <svg viewBox="0 0 24 24" width={taille} height={taille} fill="none" aria-hidden="true">
      {service === "sujets" && (
        <>
          <path d="M8.5 2.8h6.2l4.3 4.3v11.6a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2z" {...teinte} {...trait} />
          <path d="M14.5 2.9v4.3h4.4" {...trait} />
          <path d="M9.4 11.2h6.2M9.4 14.6h3.8" {...trait} />
          <path d="M5.2 13.6l.75 1.75 1.75.75-1.75.75-.75 1.75-.75-1.75-1.75-.75 1.75-.75z" fill={couleur} />
        </>
      )}
      {service === "programme" && (
        <>
          <rect x="3.8" y="4.8" width="16.4" height="15.8" rx="2.4" {...teinte} {...trait} />
          <path d="M3.8 7.2a2.4 2.4 0 0 1 2.4-2.4h11.6a2.4 2.4 0 0 1 2.4 2.4v2.4H3.8z" fill={couleur} />
          <path d="M8.2 2.9v3.6M15.8 2.9v3.6" {...trait} />
          {[
            [8.2, 13.3],
            [12, 13.3],
            [15.8, 13.3],
            [8.2, 16.9],
            [12, 16.9],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill={couleur} />
          ))}
        </>
      )}
      {service === "logements" && (
        <>
          <path d="M3.9 10.6 12 4l8.1 6.6v8.2a1.9 1.9 0 0 1-1.9 1.9H5.8a1.9 1.9 0 0 1-1.9-1.9z" {...teinte} {...trait} />
          <path d="M9.9 20.7v-5a1.2 1.2 0 0 1 1.2-1.2h1.8a1.2 1.2 0 0 1 1.2 1.2v5z" fill={couleur} />
          <path d="M12 9.6v.01" {...trait} strokeWidth={2.4} />
          <path d="M16.6 5.3v2.6" {...trait} />
        </>
      )}
      {service === "pressing" && (
        <>
          <path d="M9 3.6 4.6 5.9l1.9 3.8 1.9-.9v11.4h7.2V8.8l1.9.9 1.9-3.8L15 3.6a3 3 0 0 1-6 0z" {...teinte} {...trait} />
          <circle cx="18.6" cy="15.2" r="1.7" fill="#fff" {...trait} />
          <circle cx="20.4" cy="11.9" r="1" fill="#fff" {...trait} strokeWidth={1.4} />
          <circle cx="17" cy="19.2" r="1" fill="#fff" {...trait} strokeWidth={1.4} />
        </>
      )}
      {service === "commander" && (
        <>
          <path d="M5.4 8.2h13.2l-1 11.3a1.6 1.6 0 0 1-1.6 1.5H8a1.6 1.6 0 0 1-1.6-1.5z" fill={couleur} fillOpacity={0.28} {...trait} />
          <path d="M9 10.2V7a3 3 0 0 1 6 0v3.2" {...trait} />
        </>
      )}
    </svg>
  );
}
