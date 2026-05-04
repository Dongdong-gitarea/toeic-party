import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TOEIC PARTY - Fast Quiz Battle',
  description: 'Real-time multiplayer TOEIC vocabulary quiz game',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'TOEIC PARTY' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-slate-950 text-white antialiased overscroll-none select-none">
        {children}
      </body>
    </html>
  );
}
