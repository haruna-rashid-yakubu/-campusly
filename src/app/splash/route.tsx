import { ImageResponse } from "next/og";

export const runtime = "nodejs";
// Not force-static: that empties the query string, so every device was served
// the default size instead of its own and iOS silently ignored the image.
export const dynamic = "force-dynamic";

/*
 * The image iOS paints before any of the app exists.
 *
 * A home-screen PWA on iPhone shows plain white until the first bytes of the
 * document arrive, and nothing in the manifest changes that: Safari only uses
 * an apple-touch-startup-image, and only when its media query matches the
 * device exactly. Hence one image rendered to order, and the link tags in the
 * layout naming every iPhone size.
 *
 * It is deliberately identical to app/loading.tsx — same white, same mark,
 * same two lines — so the system splash hands over to the app's own without
 * anything moving on screen.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const width = Math.min(2000, Math.max(200, Number(searchParams.get("w")) || 1170));
  const height = Math.min(3000, Math.max(200, Number(searchParams.get("h")) || 2532));

  // The mark scales with the screen so it looks the same size on an SE as on
  // a Pro Max, rather than a fixed pixel block that dominates small devices.
  const logo = Math.round(Math.min(width, height) * 0.2);

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <svg width={logo} height={logo} viewBox="0 0 64 64">
          <rect width={64} height={64} rx={16} fill="#14B8AC" />
          <path
            d="M32 9.5c-9 0-16.3 7.2-16.3 16.1 0 11.4 13.3 24.6 15.3 26.5a1.4 1.4 0 0 0 1.9 0c2-1.9 15.3-15.1 15.3-26.5C48.3 16.7 41 9.5 32 9.5z"
            fill="#fff"
          />
          <path
            d="M37.4 22.6a7.6 7.6 0 1 0 0 10.4"
            stroke="#14B8AC"
            strokeWidth={4.4}
            strokeLinecap="round"
            fill="none"
          />
          <path d="M32 12.4 19 17.5 32 22.6l13-5.1z" fill="#0A7F77" />
          <path d="M43.4 18.1v4.6" stroke="#0A7F77" strokeWidth={1.7} strokeLinecap="round" />
          <circle cx={43.4} cy={24.2} r={1.9} fill="#0A7F77" />
        </svg>
        <div
          style={{
            marginTop: Math.round(logo * 0.26),
            fontSize: Math.round(logo * 0.34),
            fontWeight: 800,
            letterSpacing: -1,
            color: "#0F172A",
          }}
        >
          Campusly
        </div>
        <div
          style={{
            marginTop: Math.round(logo * 0.07),
            fontSize: Math.round(logo * 0.17),
            color: "#64748B",
          }}
        >
          Ton campus dans une appli
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        // The screen never changes for a given size, so it is worth caching
        // hard at the edge rather than re-rendering it on every cold start.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
