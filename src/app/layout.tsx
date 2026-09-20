import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { OfflineOverlay } from "@/components/OfflineOverlay";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { TabBarGate } from "@/components/TabBarGate";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Campusly",
  description: "Your campus. One app. — L'appli étudiante de l'UCAC Nkolbisson.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Campusly",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#14B8AC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <ToastProvider>
          {children}
          <TabBarGate />
          <OfflineOverlay />
        </ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
