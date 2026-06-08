import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { MetaPixel } from '@/components/meta-pixel'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Adigo — העלה קריאייטיבים למטא דרך ווצאפ',
  description: '30 שניות והקריאייטיבים שלך באוויר. שולחים תמונה לבוט בווצאפ — עלה ישר ל-Meta Ads',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MetaPixel />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
