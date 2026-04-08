import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'BuildArk',
  url: 'https://buildark.dev',
  description:
    'BuildArk is a boutique web development studio that builds custom apps, landing pages, and App Store products for small businesses.',
  founder: { '@type': 'Person', name: 'Raz', email: 'raz@buildark.dev' },
  slogan: 'We build the tools that carry your business forward',
  knowsAbout: [
    'Web Development',
    'App Development',
    'Next.js',
    'Supabase',
    'Vercel',
  ],
  areaServed: 'US',
  email: 'raz@buildark.dev',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://bookings.buildark.dev'),
  title: {
    default: 'Book a Call — BuildArk',
    template: '%s — BuildArk',
  },
  description:
    'Schedule a discovery call or project kickoff with Raz at BuildArk. Custom web and app development for small businesses.',
  openGraph: {
    title: 'Book a Call — BuildArk',
    description:
      'Schedule a discovery call or project kickoff with Raz at BuildArk.',
    url: 'https://bookings.buildark.dev',
    siteName: 'BuildArk Bookings',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${dmSans.variable}`}>
      <body className="font-dm antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
