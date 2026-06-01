'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

type Status = 'disconnected' | 'connecting' | 'connected' | 'error'

export default function ConnectWhatsAppPage() {
  const [status, setStatus] = useState<Status>('disconnected')
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)

  const fetchQR = useCallback(async () => {
    setStatus('connecting')
    setQrImage(null)
    try {
      const res = await fetch('/api/whatsapp/qr', { method: 'POST' })
      const data = await res.json()
      if (data.qr) {
        setQrImage(data.qr)
        setStatus('connecting')
      } else if (data.status === 'connected') {
        setStatus('connected')
        setPhone(data.phone)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchQR()
  }, [fetchQR])

  // Poll for connection status while QR is shown
  useEffect(() => {
    if (status !== 'connecting') return
    const interval = setInterval(async () => {
      const res = await fetch('/api/whatsapp/qr')
      const data = await res.json()
      if (data.status === 'connected') {
        setStatus('connected')
        setPhone(data.phone)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [status])

  return (
    <div className="p-8 max-w-md">
      <h2 className="text-2xl font-bold text-white mb-2">חיבור WhatsApp</h2>
      <p className="text-zinc-400 mb-8">חבר את הווצאפ שלך — תשלח קריאייטיבים ממנו ישירות ל-Meta Ads</p>

      {status === 'connected' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg">מחובר!</h3>
          {phone && <p className="text-emerald-400 font-mono mt-1">+{phone}</p>}
          <p className="text-zinc-400 text-sm mt-2">שלח תמונה/סרטון מהמספר הזה לבוט שלך</p>
        </div>
      ) : status === 'error' ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-white font-bold">שגיאה בחיבור</h3>
          <p className="text-zinc-400 text-sm mt-2 mb-4">השרת לא זמין. נסה שוב.</p>
          <Button onClick={fetchQR} variant="outline" className="gap-2 border-zinc-700 text-zinc-300">
            <RefreshCw className="w-4 h-4" /> נסה שוב
          </Button>
        </div>
      ) : (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8">
          <div className="flex flex-col gap-4 mb-6">
            {[
              'פתח WhatsApp בנייד',
              'עבור לכלים → מכשירים מקושרים',
              'לחץ "קשר מכשיר" וסרוק את הקוד',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-700 text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-zinc-300 text-sm">{step}</span>
              </div>
            ))}
          </div>

          {qrImage ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-xl">
                <Image src={qrImage} alt="QR Code" width={200} height={200} />
              </div>
              <p className="text-zinc-500 text-xs">QR מתחלף כל 20 שניות</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
