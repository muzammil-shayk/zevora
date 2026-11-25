import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zevorastores.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ZEVORA — Jewellery Beyond Elegance',
    template: '%s | ZEVORA'
  },
  description:
    'ZEVORA — Jewellery Beyond Elegance. Sculptural 316L stainless steel rings in silver-tone and gold-color finishes with precision-cut black and clear cubic zirconia crystals.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'ZEVORA',
    title: 'ZEVORA — Jewellery Beyond Elegance',
    description:
      'Waterproof 316L stainless steel rings & AAA crystal craft. Timeless elegance, premium quality, lasting beauty—made for you.',
    images: [
      {
        url: '/images/brand/zevora-logo-full-hd.png',
        width: 1920,
        height: 1200,
        alt: 'ZEVORA — Jewellery Beyond Elegance'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZEVORA — Jewellery Beyond Elegance',
    description:
      'Sculptural 316L stainless steel rings in silver-tone and gold-color finishes with precision-cut crystals.',
    images: ['/images/brand/zevora-logo-full-hd.png']
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
