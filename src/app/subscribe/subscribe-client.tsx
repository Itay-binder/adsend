'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackEvent, trackCustom } from '@/components/meta-pixel'

export function SubscribeClient({ hasUsedTrial }: { hasUsedTrial: boolean }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    trackEvent('InitiateCheckout', {
      content_name: hasUsedTrial ? 'Adigo Renewal' : 'Adigo Trial',
      value: hasUsedTrial ? 99 : 0,
      currency: 'ILS',
    })
    if (!hasUsedTrial) trackCustom('welcome')
  }, [hasUsedTrial])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // First-time signup: save the phone before anything else. Renewals already
    // have a phone on file (or don't need a fresh one), so skip the save step.
    if (!hasUsedTrial) {
      const phoneRes = await fetch('/api/save-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const phoneJson = await phoneRes.json().catch(() => ({}))
      if (!phoneRes.ok) {
        setError(phoneJson.error ?? 'שגיאה בשמירת הטלפון')
        setLoading(false)
        return
      }
    }

    // 'checkout' = the moment they actually leave for Cardcom (post-phone).
    trackCustom('checkout', {
      content_name: hasUsedTrial ? 'Adigo Renewal' : 'Adigo Trial',
      value: hasUsedTrial ? 99 : 0,
      currency: 'ILS',
    })

    const trialUrl = process.env.NEXT_PUBLIC_CARDCOM_TRIAL_URL
    const renewalUrl = process.env.NEXT_PUBLIC_CARDCOM_RENEWAL_URL
    const target = hasUsedTrial ? renewalUrl : trialUrl
    if (target) {
      window.location.href = target
      return
    }

    try {
      const res = await fetch('/api/cardcom/create-payment', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'שגיאה לא ידועה')
        setLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
      else {
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image src="/adigo-icon.png" alt="Adigo" width={64} height={64} className="rounded-full shadow-2xl shadow-emerald-500/20 mb-3" priority />
          <h1 className="text-3xl font-black text-white mb-2">
            Adi<span className="text-sky-400">go</span>
          </h1>
          <p className="text-zinc-400">{hasUsedTrial ? 'חידוש מנוי' : 'התחל את הניסיון שלך'}</p>
        </div>

        <div className="bg-zinc-800/60 border border-zinc-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            {hasUsedTrial ? (
              <>
                <p className="text-5xl font-black text-white mb-1">₪99</p>
                <p className="text-zinc-400 text-sm">לחודש · ביטול בכל עת</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <span className="text-lg">🎁</span>
                  <span className="text-emerald-400 font-bold text-sm">7 ימי ניסיון חינם</span>
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

          <form onSubmit={handleSubscribe} className="space-y-3">
            {!hasUsedTrial && (
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-zinc-300 mb-1.5" dir="rtl">
                  טלפון לוואטסאפ
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-1234567"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center font-bold text-base placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5" dir="rtl">
                  כדי שנוכל לעזור לך אם תתקע
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!hasUsedTrial && phone.replace(/\D/g, '').length < 9)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
            >
              {loading ? 'מעביר לתשלום...' : hasUsedTrial ? 'לתשלום מאובטח' : 'התחל ניסיון חינם'}
            </button>
          </form>

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
