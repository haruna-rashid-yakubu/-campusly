import type { NextConfig } from "next";

// script-src/style-src need 'unsafe-inline' because Next's hydration
// bootstrap script and this app's many inline `style={{}}` props aren't
// nonce-tagged — a stricter nonce-based CSP would need proxy-level nonce
// injection, which isn't set up. This still blocks arbitrary third-party
// <script src> injection and restricts every other resource type.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // blob: is for the preview of a photo the student has just taken, before it
  // is uploaded — the URL is minted by this page from a file the person chose,
  // and nothing else can produce one.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Files are sent to this site itself (/api/envoi) and served by it (/fichiers).
  "connect-src 'self'",
  // Still Google's viewer in production: the native PDF reader ships in a
  // later batch, and dropping this origin before it would blank every preview.
  "frame-src https://docs.google.com",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // A self-contained server (.next/standalone) for the Docker image.
  output: "standalone",
  /*
   * The tutor's PDF report is printed by the Chromium the image installs
   * (lib/pdf-serveur). Puppeteer is loaded from node_modules at run time
   * rather than bundled.
   */
  serverExternalPackages: ["puppeteer-core"],
  /*
   * A Server Action body is capped at 1 MB by default, and one photograph of
   * an exam sheet is already past it — which is why sending a paper failed
   * with nothing useful on screen. The batch uploader now sends its files
   * through /api/envoi and never hits this, but the single-file forms still
   * post through an action: a student proposing a paper or a timetable, an
   * admin attaching the week's photo.
   *
   * 25 MB, the most lib/envois keeps: a Worker takes request bodies far
   * larger, so the limit is now ours rather than the platform's.
   */
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // The files people send, served by /fichiers (lib/envois) at an absolute address.
        hostname: "www.mycampusly.fr",
        pathname: "/fichiers/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
