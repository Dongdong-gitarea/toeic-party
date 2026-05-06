import type { Metadata, Viewport } from 'next';
import './globals.css';
import MusicSync from '@/components/MusicSync';

export const metadata: Metadata = {
  title: '多益派對 TOEIC PARTY — 4人單字對戰',
  description: '4人即時對戰！快節奏 TOEIC 單字挑戰，每回合 10 秒，你能多快拆開單字？',
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://toeic-party.up.railway.app'),
  openGraph: {
    title: '多益派對 TOEIC PARTY — 4人單字對戰',
    description: '4人即時對戰！快節奏 TOEIC 單字挑戰，每回合 10 秒，你能多快拆開單字？',
    url: 'https://toeic-party.up.railway.app',
    siteName: 'TOEIC PARTY',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '多益派對 TOEIC PARTY' }],
    type: 'website',
    locale: 'zh_TW',
  },
  twitter: {
    card: 'summary_large_image',
    title: '多益派對 TOEIC PARTY — 4人單字對戰',
    description: '快節奏 TOEIC 單字挑戰，每回合 10 秒！',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TOEIC PARTY',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4c1d95',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-[100dvh] bg-slate-950 text-white antialiased overscroll-none select-none">
        <MusicSync />
        {children}
      </body>
    </html>
  );
}
