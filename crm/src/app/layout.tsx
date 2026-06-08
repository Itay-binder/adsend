import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adigo CRM',
  description: 'ניהול לקוחות Adigo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-[#0B1220] text-white antialiased">{children}</body>
    </html>
  )
}
