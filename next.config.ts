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
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.public.blob.vercel-storage.com",
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
  /*
   * A Server Action body is capped at 1 MB by default, and one photograph of
   * an exam sheet is already past it — which is why sending a paper failed
   * with nothing useful on screen. The batch uploader now sends its files
   * straight to the blob store and never hits this, but the single-file
   * forms still post through an action: a student proposing a paper or a
   * timetable, an admin attaching the week's photo.
   *
   * 4 MB rather than more: the platform refuses a function request body over
   * 4.5 MB whatever is written here, so a larger number would only move the
   * failure somewhere less legible.
   */
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    /*
     * 2048 and 3840 removed from the candidates. No phone reading this app
     * has a screen that wide, and leaving them in means any image whose
     * `sizes` is wrong or missing can quietly bill a student several
     * megabytes of mobile data for one photograph. 1920 is already more than
     * a whiteboard needs to be legible.
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
