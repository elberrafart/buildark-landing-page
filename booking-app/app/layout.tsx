import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Book a Call — BuildArk',
  description: 'Schedule time with Raz at BuildArk. Discovery calls and project kickoffs.',
  openGraph: {
    title: 'Book a Call — BuildArk',
    description: 'Schedule time with Raz at BuildArk.',
    url: 'https://bookings.buildark.dev',
    siteName: 'BuildArk Bookings',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-dm antialiased">
        {children}
      </body>
    </html>
  )
}
