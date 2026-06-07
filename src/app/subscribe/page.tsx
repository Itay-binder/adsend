'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    const paymentUrl = process.env.NEXT_PUBLIC_CARDCOM_PAYMENT_URL
    if (paymentUrl) {
      window.location.href = paymentUrl
      return
    }
    // Fallback: dynamic LowProfile
    try {
      const res = await fetch('/api/cardcom/create-payment', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'שגיאה לא ידועה')
        setLoading(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('לא התקבל קישור תשלום')
        setLoading(false)
      }
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            Ad<span className="text-emerald-400">Send</span>
          </h1>
          <p className="text-zinc-400">התחל את הניסיון שלך</p>
        </div>

        <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <span className="text-lg">🎁</span>
              <span className="text-emerald-400 font-bold text-sm">7 ימי ניסיון חינם</span>
            </div>
            <p className="text-5xl font-black text-white mb-1">₪0</p>
            <p className="text-zinc-400 text-sm">לתשלום עכשיו</p>
            <p className="text-zinc-500 text-xs mt-2">לאחר 7 ימים — ₪99 לחודש · ביטול בכל עת</p>
          </div>

          <ul className="space-y-3 mb-8 text-sm text-zinc-300">
            {[
              'העלאת קריאייטיבים ישירות מווצאפ',
              'חיבור לכל חשבון Meta Ads',
              'בוט AI שמבין עברית חופשית',
              'היסטוריית העלאות',
              '7 ימי ניסיון מלאים — תשלום מתחיל רק אחרי',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold text-base transition-colors"
          >
            {loading ? 'מעביר לתשלום...' : 'התחל ניסיון חינם'}
          </button>

          <p className="text-center text-zinc-600 text-xs mt-4">
            נדרש פרטי תשלום לאימות · לא יחויב במהלך הניסיון<br />
            תשלום מאובטח דרך Cardcom · SSL מוצפן
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-4 w-full text-center text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
        >
          התנתקות
        </button>
      </div>
    </div>
  )
}
