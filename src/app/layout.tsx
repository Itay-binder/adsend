import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { MetaPixel } from '@/components/meta-pixel'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/google-tag-manager'
import './globals.css'

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Adigo — העלה קריאייטיבים למטא דרך ווצאפ',
  description: '30 שניות והקריאייטיבים שלך באוויר. שולחים תמונה לבוט בווצאפ, עולה ישר ל-Meta Ads',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <head>
        <GoogleTagManager />
      </head>
      <body className={`min-h-full flex flex-col ${rubik.className}`}>
        <GoogleTagManagerNoScript />
        <MetaPixel />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
