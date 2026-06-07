import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AdSend CRM',
  description: 'ניהול לקוחות AdSend',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  )
}
