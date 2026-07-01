import type { Metadata } from 'next'
import { Assistant } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { MetaPixel } from '@/components/meta-pixel'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/google-tag-manager'
import './globals.css'

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  variable: '--font-assistant',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Adigo — Upload Meta Ads creatives from WhatsApp',
  description: 'Push image and video creatives to Meta Ads Manager in 30 seconds — straight from a WhatsApp message.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${assistant.variable} h-full antialiased`}>
      <head>
        <GoogleTagManager />
      </head>
      <body className={`min-h-full flex flex-col ${assistant.className}`}>
        <GoogleTagManagerNoScript />
        <MetaPixel />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
