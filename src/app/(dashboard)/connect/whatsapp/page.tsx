'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, RefreshCw, AlertCircle, Smartphone, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

type Status = 'disconnected' | 'connecting' | 'connected' | 'error'
type Mode = 'qr' | 'phone'

export default function ConnectWhatsAppPage() {
  const [status, setStatus] = useState<Status>('disconnected')
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('qr')
  const [phoneInput, setPhoneInput] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const fetchQR = useCallback(async () => {
    setStatus('connecting')
    setQrImage(null)
    try {
      const res = await fetch('/api/whatsapp/qr', { method: 'POST' })
      if (!res.ok) { setStatus('error'); return }
      const data = await res.json()
      if (data.status === 'connected') {
        setStatus('connected')
        setPhone(data.phone)
      } else if (data.qr) {
        setQrImage(data.qr)
        setStatus('connecting')
      } else if (data.status === 'connecting') {
        setStatus('connecting')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (mode === 'qr') fetchQR()
  }, [fetchQR, mode])

  // Poll while connecting
  useEffect(() => {
    if (status !== 'connecting') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/qr')
        const data = await res.json()
        if (data.status === 'connected') {
          setStatus('connected')
          setPhone(data.phone)
          setPairingCode(null)
          clearInterval(interval)
        } else if (data.qr && mode === 'qr') {
          setQrImage(data.qr)
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(interval)
  }, [status, mode])

  async function requestPairingCode() {
    const digits = phoneInput.replace(/\D/g, '')
    if (digits.length < 10) { setPhoneError('מספר לא תקין'); return }
    setPhoneLoading(true)
    setPhoneError(null)
    setPairingCode(null)
    try {
      const res = await fetch('/api/whatsapp/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const data = await res.json()
      if (data.ok && data.code) {
        setPairingCode(data.code)
        setStatus('connecting')
      } else {
        setPhoneError(data.error ?? 'שגיאה בקבלת קוד')
      }
    } catch {
      setPhoneError('שרת לא זמין')
    } finally {
      setPhoneLoading(false)
    }
  }

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
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode('qr'); setPairingCode(null); setPhoneError(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'qr' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <QrCode className="w-4 h-4" /> QR Code
            </button>
            <button
              onClick={() => { setMode('phone'); setQrImage(null); setPhoneError(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'phone' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Smartphone className="w-4 h-4" /> קוד טלפון
            </button>
          </div>

          {mode === 'qr' ? (
            <>
              <div className="flex flex-col gap-3 mb-6">
                {['פתח WhatsApp בנייד', 'עבור לכלים → מכשירים מקושרים', 'לחץ "קשר מכשיר" וסרוק את הקוד'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-700 text-white text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
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
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  'פתח WhatsApp בנייד',
                  'עבור לכלים → מכשירים מקושרים',
                  'לחץ "קשר מכשיר" ואז "קשר עם מספר טלפון"',
                  'הזן את הקוד שיופיע כאן',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-700 text-white text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                    <span className="text-zinc-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>

              {!pairingCode ? (
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="מספר טלפון (לדוג׳: 972526660006)"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white text-left placeholder:text-zinc-600"
                    dir="ltr"
                  />
                  {phoneError && <p className="text-red-400 text-xs">{phoneError}</p>}
                  <Button
                    onClick={requestPairingCode}
                    disabled={phoneLoading || !phoneInput}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {phoneLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'קבל קוד חיבור'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-zinc-400 text-sm">הזן את הקוד הזה ב-WhatsApp:</p>
                  <div className="bg-zinc-900 border border-zinc-600 rounded-xl px-8 py-4">
                    <p className="text-3xl font-mono font-bold text-white tracking-widest text-center">{pairingCode}</p>
                  </div>
                  <p className="text-zinc-500 text-xs">הקוד תקף לכמה דקות</p>
                  {status === 'connecting' && (
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <RefreshCw className="w-3 h-3 animate-spin" /> ממתין לחיבור...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
