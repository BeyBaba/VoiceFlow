import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceFlow - Don't Type, Just Speak",
  description:
    "The fastest voice dictation tool. Works everywhere on Windows and mobile. 4x faster than typing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
