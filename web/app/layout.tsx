import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: 'CounterUAVHub — Drone Signal & Counter-Drone Technical Reference',
    template: '%s | CounterUAVHub',
  },
  description:
    'Technical reference platform for counter-drone professionals. Look up drone RF frequencies, signal protocols, and jamming parameters for 25+ models.',
  metadataBase: new URL('https://counteruavhub.com'),
  openGraph: {
    siteName: 'CounterUAVHub',
    locale: 'en_US',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NYXPGV7XCR"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NYXPGV7XCR');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
