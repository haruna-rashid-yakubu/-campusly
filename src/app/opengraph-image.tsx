import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A7F77",
          fontFamily: "sans-serif",
        }}
      >
        <svg width={120} height={120} viewBox="0 0 64 64">
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
        <div style={{ marginTop: 28, fontSize: 72, fontWeight: 800, color: "#fff" }}>Campusly</div>
        <div style={{ marginTop: 10, fontSize: 30, color: "#CFF3EF" }}>Your campus. One app.</div>
      </div>
    ),
    size
  );
}
