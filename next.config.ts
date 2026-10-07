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
  /*
   * vercel.com is here because the browser needs it to send a file.
   *
   * @vercel/blob/client first asks our own route for a token, then calls the
   * blob API at https://vercel.com/api/blob to get the presigned URL, and
   * only then PUTs to the store. That middle call was blocked, so a paper
   * could not leave a student's phone at all -- and the failure was silent.
   * The wildcard below covers the store itself, never the API.
   */
  "connect-src 'self' https://vercel.com https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com",
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
