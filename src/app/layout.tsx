import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import OfflineBanner from "@/components/OfflineBanner";
import NotificationPrompt from "@/components/NotificationPrompt";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6d28d9",
};

export const metadata: Metadata = {
  title: "VoiceFlow - Don't Type, Just Speak",
  description:
    "The fastest voice dictation tool. Works everywhere on Windows and mobile. 4x faster than typing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceFlow",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <Providers>
          <OfflineBanner />
          {children}
          <NotificationPrompt />
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
