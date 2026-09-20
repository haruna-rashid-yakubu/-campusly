# Campusly

Student super-app for UCAC Nkolbisson — anciens sujets, logements, pressing, and the weekly
programme, built as an installable PWA.

Implemented from the `Campusly Prototype.dc.html` Claude Design handoff (see `../README.md`,
`../chats/chat1.md` and `../project/` at the repo root for the original design brief and
click-through prototype this app was built from).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Neon Postgres** via **Drizzle ORM** (`@neondatabase/serverless`)
- **Auth.js (NextAuth v5)** with the Google provider for real sign-in
- **Vercel Blob** for uploaded subject files and programme photos
- A hand-rolled service worker (`public/sw.js`) + web app manifest for installability and an
  offline fallback

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Neon Postgres connection string ([neon.tech](https://neon.tech), free tier is fine).
   - `AUTH_SECRET` — generate with `npx auth secret`.
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from a Google Cloud OAuth client
     (console.cloud.google.com → APIs & Services → Credentials → OAuth client ID → Web
     application). Add `http://localhost:3000/api/auth/callback/google` (and your production URL
     equivalent) as an authorized redirect URI.
   - `ADMIN_EMAILS` — comma-separated emails that get the `admin` role the first time they sign
     in with Google. Admins can reach `/admin` (subject moderation, room stock, programme
     publishing).
   - `BLOB_READ_WRITE_TOKEN` — from a Vercel Blob store (Vercel dashboard → Storage → Create
     Blob store). Needed for the "Proposer un sujet" and admin "Publier le programme" uploads to
     work; without it those actions fail with a clear error instead of silently doing nothing.
3. Push the schema and seed the reference data (subjects, cités, room types, pressings):
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. `npm run dev` and open http://localhost:3000.

## Notable implementation choices vs. the prototype

The prototype was a single clickable `.dc.html` mock with all state held in memory and no real
backend. This app is the real thing, so a few things were adapted rather than copied literally:

- **No fake device chrome.** The prototype rendered its own phone bezel, a fake `09:41` status
  bar, and a drawn-on home-indicator pill — that was Claude Design's preview chrome, not part of
  the product. Real phones (and the installed PWA) provide their own; this app only reserves
  `env(safe-area-inset-*)` space for the notch and home indicator.
- **Filters and search are URL state**, not client-only component state — `/sujets?filiere=...`
  and `/logements?dist=...` are shareable/bookmarkable and drive real server-side Drizzle
  queries, rather than filtering an in-memory array.
- **Bottom sheets stayed** as a real UI pattern (`components/Sheet.tsx` + `PickerButton.tsx`) for
  class/filter/form-field pickers, since that was a deliberately iterated-on piece of the design
  per the chat transcript.
- **Fullscreen document/photo viewers are real routes** (`/sujets/[id]/plein`,
  `/programme/plein`) instead of client-only overlay state, so the back button and deep links
  work naturally.
- **The "Installer maintenant" button uses the real `beforeinstallprompt` API** on Android/Chrome
  instead of being decorative; on iOS (which has no such API) only the manual Safari steps show,
  which is more accurate than the prototype always showing an install button.
- **Subject PDFs/images without an uploaded file** (i.e. the seeded reference subjects) show an
  explicit "aperçu indisponible pour ce contenu de démonstration" placeholder instead of the
  prototype's fake skeleton-bars mockup — anything a student actually submits and gets approved
  renders for real (PDF in an `<iframe>`, images with pinch-to-zoom-style +/− controls).
- **Cité/room photo uploads and a cité-creation form are not wired up.** The prototype itself
  never specified that flow either (its admin screen only exposes stock +/-); the "Ajouter une
  cité" admin action is left as a note pointing at doing this outside the app for now, matching
  the prototype's own scope.
- **The install banner and "classe" selector persist via a cookie**, not the prototype's
  in-memory `state`, so they actually survive a reload.

## Project layout

```
src/
  app/            Routes (App Router). Tab-bar screens live at the top level
                   (/, /sujets, /logements, /pressing, /programme); /sujets/proposer,
                   /installer and /admin intentionally hide the tab bar (see lib/nav.ts).
  components/      Shared UI: Sheet/PickerButton, TabBar, Toast, icons, admin widgets…
  db/              Drizzle schema, client, and the seed script.
  lib/             Data access (data.ts), mutations (actions.ts, all Server Actions),
                   constants, small utils.
  auth.ts          NextAuth config (Google + Drizzle adapter).
public/sw.js       Minimal offline-fallback service worker.
```

## Deploying

Any Next.js host works; Vercel is the path of least resistance since Blob storage is already a
Vercel product. Set the same env vars there, run `npm run db:push` once against the production
`DATABASE_URL`, then `npm run db:seed` if you want the reference data.
