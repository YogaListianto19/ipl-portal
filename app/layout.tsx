import type { Metadata, Viewport } from 'next'
import { Nunito_Sans } from 'next/font/google'
import './globals.css'

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Portal IPL Rossela — G-Land Katapang',
  description: 'Portal informasi tagihan IPL warga Blok Rossela G-Land Katapang Residence',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#BE123C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={nunito.variable}>
      <body className="min-h-dvh bg-background antialiased font-sans">{children}</body>
    </html>
  )
}
