import { ImageResponse } from "next/og";
import { APP_DOMAIN } from "@/lib/constants";

export const dynamic = "force-static";

/*
 * The poster for a WhatsApp statut, at the 9:16 a statut is shown in.
 *
 * No website can post to a statut — WhatsApp has no address for it — so the
 * app cannot do it on anyone's behalf. What it can do is hand over something
 * that takes one tap to publish from WhatsApp itself, which works the same on
 * every phone and depends on no share sheet behaving.
 *
 * The wording is the launch message, kept word for word so the statut and the
 * message say the same thing.
 */
const DOULEURS = [
  "Remonter deux cents messages dans le groupe pour retrouver la photo du programme.",
  "Ne plus savoir combien de séances il reste avant le CC.",
  "Faire tout le quartier à pied pour trouver une chambre.",
];

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A7F77",
          fontFamily: "sans-serif",
          /*
           * WhatsApp draws its own furniture over a statut: the progress bars
           * and the sender's name along the top, the reply bar along the
           * bottom. The generous top and bottom padding keeps the logo and,
           * above all, the address out from under them — an address hidden
           * behind the reply bar is the one line the poster exists for.
           */
          padding: "210px 80px 240px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width={96} height={96} viewBox="0 0 64 64">
              <rect width={64} height={64} rx={16} fill="#fff" />
              <path
                d="M32 9.5c-9 0-16.3 7.2-16.3 16.1 0 11.4 13.3 24.6 15.3 26.5a1.4 1.4 0 0 0 1.9 0c2-1.9 15.3-15.1 15.3-26.5C48.3 16.7 41 9.5 32 9.5z"
                fill="#14B8AC"
              />
              <path
                d="M37.4 22.6a7.6 7.6 0 1 0 0 10.4"
                stroke="#fff"
                strokeWidth={4.4}
                strokeLinecap="round"
                fill="none"
              />
              <path d="M32 12.4 19 17.5 32 22.6l13-5.1z" fill="#0A7F77" />
            </svg>
            <div style={{ marginLeft: 28, fontSize: 64, fontWeight: 800, color: "#fff" }}>
              Campusly
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 96 }}>
            {DOULEURS.map((d) => (
              <div
                key={d}
                style={{
                  display: "flex",
                  fontSize: 42,
                  lineHeight: 1.35,
                  color: "#CFF3EF",
                  marginBottom: 34,
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 800, color: "#fff" }}>
            C&rsquo;est fini.
          </div>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 800, color: "#FFD966" }}>
            Et c&rsquo;est gratuit.
          </div>
          <div style={{ display: "flex", marginTop: 34, fontSize: 44, color: "#CFF3EF" }}>
            Campusly, pour toute la cato.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "#fff",
              borderRadius: 24,
              padding: "26px 40px",
              fontSize: 42,
              fontWeight: 700,
              color: "#0A7F77",
            }}
          >
            {APP_DOMAIN}
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 34, color: "#9FE3DC" }}>
            Ouvre, puis pose-le sur ton écran d&rsquo;accueil.
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
