// GhostX Layout - Karanlik tema, SEO yok, gizli sayfa

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GhostX',
  robots: 'noindex, nofollow', // Arama motorlarindan gizle
};

export default function GhostXLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ghostx-root" style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0b141a',
      color: '#e9edef',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {children}
    </div>
  );
}
