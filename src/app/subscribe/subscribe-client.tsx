'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SubscribeClient({ hasUsedTrial }: { hasUsedTrial: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)
    setError(null)

    const trialUrl = process.env.NEXT_PUBLIC_CARDCOM_TRIAL_URL
    const renewalUrl = process.env.NEXT_PUBLIC_CARDCOM_RENEWAL_URL

    // Returning customer → renewal page (₪99). First-time → trial page (₪0).
    const target = hasUsedTrial ? renewalUrl : trialUrl
    if (target) {
      window.location.href = target
      return
    }

    // Fallback: dynamic LowProfile (only if env vars aren't configured)
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
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image src="/adigo-icon.png" alt="Adigo" width={64} height={64} className="rounded-xl shadow-2xl shadow-brand/20 mb-3" priority />
          <h1 className="text-3xl font-black text-white mb-2">
            Adi<span className="text-brand">go</span>
          </h1>
          <p className="text-zinc-400">{hasUsedTrial ? 'חידוש מנוי' : 'התחל את הניסיון שלך'}</p>
        </div>

        <div className="bg-[#101A2E]/80 border border-zinc-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            {hasUsedTrial ? (
              <>
                <p className="text-5xl font-black text-white mb-1">₪99</p>
                <p className="text-zinc-400 text-sm">לחודש · ביטול בכל עת</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/30 mb-4">
                  <span className="text-lg">🎁</span>
                  <span className="text-brand font-bold text-sm">7 ימי ניסיון חינם</span>
                </div>
                <p className="text-5xl font-black text-white mb-1">₪0</p>
                <p className="text-zinc-400 text-sm">לתשלום עכשיו</p>
                <p className="text-zinc-500 text-xs mt-2">לאחר 7 ימים — ₪99 לחודש · ביטול בכל עת</p>
              </>
            )}
          </div>

          <ul className="space-y-3 mb-8 text-sm text-zinc-300">
            {(hasUsedTrial ? [
              'העלאת קריאייטיבים ישירות מווצאפ',
              'חיבור לכל חשבון Meta Ads',
              'בוט AI שמבין עברית חופשית',
              'היסטוריית העלאות',
              'גישה מיידית לכל הפיצ׳רים',
            ] : [
              'העלאת קריאייטיבים ישירות מווצאפ',
              'חיבור לכל חשבון Meta Ads',
              'בוט AI שמבין עברית חופשית',
              'היסטוריית העלאות',
              '7 ימי ניסיון מלאים — תשלום מתחיל רק אחרי',
            ]).map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-brand">✓</span>
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
            className="w-full py-3.5 rounded-xl bg-brand hover:bg-[#00B8AF] disabled:bg-zinc-700 text-[#0B1220] font-bold text-base transition-colors"
          >
            {loading ? 'מעביר לתשלום...' : hasUsedTrial ? 'לתשלום מאובטח' : 'התחל ניסיון חינם'}
          </button>

          <p className="text-center text-zinc-600 text-xs mt-4">
            {hasUsedTrial
              ? 'תשלום מאובטח דרך Cardcom · SSL מוצפן'
              : <>נדרש פרטי תשלום לאימות · לא יחויב במהלך הניסיון<br />תשלום מאובטח דרך Cardcom · SSL מוצפן</>}
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
