import type { Metadata } from 'next'
import './globals.css'

// Using system fonts for reliable deployment
const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

export const metadata: Metadata = {
  title: 'Baby Raffle - Create Beautiful Baby Betting Sites | Share the Joy',
  description: 'Create stunning, secure baby raffle websites where family and friends can make predictions about your little one\'s arrival. Beautiful themes, payment integration, and memories that last forever.',
  keywords: [
    'baby raffle',
    'baby betting',
    'baby pool',
    'baby predictions',
    'baby shower',
    'expecting parents',
    'baby celebration',
    'family fun',
    'pregnancy',
    'baby website'
  ],
  authors: [{ name: 'Baby Raffle Team' }],
  creator: 'Baby Raffle',
  publisher: 'Baby Raffle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mybabyraffle.base2ml.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Baby Raffle - Create Beautiful Baby Betting Sites',
    description: 'Create stunning, secure baby raffle websites where family and friends can make predictions about your little one\'s arrival.',
    url: 'https://babyraffle.base2ml.com',
    siteName: 'Baby Raffle',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Baby Raffle - Beautiful Baby Celebration Websites',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baby Raffle - Create Beautiful Baby Betting Sites',
    description: 'Create stunning, secure baby raffle websites where family and friends can make predictions about your little one\'s arrival.',
    images: ['/twitter-image.jpg'],
    creator: '@babyraffle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#a855f7" />
      </head>
      <body style={{fontFamily}} className="antialiased">
        {children}
      </body>
    </html>
  )
}