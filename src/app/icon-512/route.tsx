import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <svg width={512} height={512} viewBox="0 0 64 64">
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
    ),
    { width: 512, height: 512 }
  );
}
