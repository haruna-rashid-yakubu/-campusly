import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { auth } from "@/auth";
import { ToastProvider } from "@/components/Toast";
import { LoginPromptSheet } from "@/components/LoginPromptSheet";
import { OfflineOverlay } from "@/components/OfflineOverlay";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { TabBarGate } from "@/components/TabBarGate";
import { APP_URL } from "@/lib/constants";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_DESCRIPTION =
  "Campusly — l'appli étudiante de l'UCAC Nkolbisson : anciens sujets d'examens, logements vérifiés autour du campus, pressings partenaires et programme de la semaine.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Campusly — Your campus. One app.",
    template: "%s · Campusly",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "UCAC Nkolbisson",
    "sujets d'examens",
    "anciens sujets",
    "logements étudiants Yaoundé",
    "pressing campus",
    "programme de cours",
    "application étudiante",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Campusly",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "Campusly",
    title: "Campusly — Your campus. One app.",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Campusly — Your campus. One app.",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14B8AC",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="fr" className={`${manrope.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <ToastProvider>
          {children}
          <TabBarGate />
          <OfflineOverlay />
          <LoginPromptSheet signedIn={!!session?.user} />
        </ToastProvider>
        <ServiceWorkerRegister />
        <SpeedInsights />
      </body>
    </html>
  );
}
