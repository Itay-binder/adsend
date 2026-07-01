'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackEvent, trackCustom } from '@/components/meta-pixel'
import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'

const T = {
  en: {
    heading_trial: 'Start your trial',
    heading_renewal: 'Renew your subscription',
    trial_badge: '7-day free trial',
    trial_price: '₪0',
    trial_price_sub: 'due today',
    trial_after: 'After 7 days — ₪99/month · cancel any time',
    renewal_price: '₪99',
    renewal_sub: 'per month · cancel any time',
    features: {
      trial: [
        'Push creatives to Meta Ads straight from WhatsApp',
        'Connect any Meta Ads account',
        'AI bot that understands natural English/Hebrew',
        'Full upload history',
        '7-day full trial — billing starts only after',
      ],
      renewal: [
        'Push creatives to Meta Ads straight from WhatsApp',
        'Connect any Meta Ads account',
        'AI bot that understands natural English/Hebrew',
        'Full upload history',
        'Instant access to every feature',
      ],
    },
    phone_label: 'WhatsApp phone',
    phone_ph: '050-1234567',
    phone_helper: 'So we can help you if you get stuck',
    cta_trial: 'Start free trial',
    cta_renewal: 'Continue to secure payment',
    cta_loading: 'Redirecting to payment...',
    disclaimer_trial: (
      <>Card required for verification · No charge during the trial<br />Secure payment via Cardcom · SSL encrypted</>
    ),
    disclaimer_renewal: 'Secure payment via Cardcom · SSL encrypted',
    sign_out: 'Sign out',
    err_phone: 'Invalid phone number',
    err_generic: 'Unknown error',
    err_no_url: 'No payment link received',
    err_save_phone: 'Failed to save phone',
  },
  he: {
    heading_trial: 'התחל את הניסיון שלך',
    heading_renewal: 'חידוש מנוי',
    trial_badge: '7 ימי ניסיון חינם',
    trial_price: '₪0',
    trial_price_sub: 'לתשלום עכשיו',
    trial_after: 'לאחר 7 ימים — ₪99 לחודש · ביטול בכל עת',
    renewal_price: '₪99',
    renewal_sub: 'לחודש · ביטול בכל עת',
    features: {
      trial: [
        'העלאת קריאייטיבים ישירות מווצאפ',
        'חיבור לכל חשבון Meta Ads',
        'בוט AI שמבין עברית חופשית',
        'היסטוריית העלאות',
        '7 ימי ניסיון מלאים — תשלום מתחיל רק אחרי',
      ],
      renewal: [
        'העלאת קריאייטיבים ישירות מווצאפ',
        'חיבור לכל חשבון Meta Ads',
        'בוט AI שמבין עברית חופשית',
        'היסטוריית העלאות',
        'גישה מיידית לכל הפיצ׳רים',
      ],
    },
    phone_label: 'טלפון לוואצפ',
    phone_ph: '050-1234567',
    phone_helper: 'כדי שנוכל לעזור לך אם תתקע',
    cta_trial: 'התחל ניסיון חינם',
    cta_renewal: 'לתשלום מאובטח',
    cta_loading: 'מעביר לתשלום...',
    disclaimer_trial: (
      <>נדרש פרטי תשלום לאימות · לא יחויב במהלך הניסיון<br />תשלום מאובטח דרך Cardcom · SSL מוצפן</>
    ),
    disclaimer_renewal: 'תשלום מאובטח דרך Cardcom · SSL מוצפן',
    sign_out: 'התנתקות',
    err_phone: 'מספר טלפון לא תקין',
    err_generic: 'שגיאה לא ידועה',
    err_no_url: 'לא התקבל קישור תשלום',
    err_save_phone: 'שגיאה בשמירת הטלפון',
  },
} as const

export function SubscribeClient({ hasUsedTrial }: { hasUsedTrial: boolean }) {
  const locale = useLocale()
  useApplyHtmlDir(locale)
  const dir = dirFor(locale)
  const t = T[locale]

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

    if (!hasUsedTrial) {
      const phoneRes = await fetch('/api/save-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const phoneJson = await phoneRes.json().catch(() => ({}))
      if (!phoneRes.ok) {
        setError(phoneJson.error ?? t.err_save_phone)
        setLoading(false)
        return
      }
    }

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
        setError(data.error ?? t.err_generic)
        setLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
      else {
        setError(t.err_no_url)
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

  const features = hasUsedTrial ? t.features.renewal : t.features.trial

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6" dir={dir}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image src="/adigo-icon.png" alt="Adigo" width={64} height={64} className="rounded-full shadow-2xl shadow-emerald-500/20 mb-3" priority />
          <h1 className="text-3xl font-black text-white mb-2" dir="ltr">
            Adi<span className="text-sky-400">go</span>
          </h1>
          <p className="text-zinc-400">{hasUsedTrial ? t.heading_renewal : t.heading_trial}</p>
        </div>

        <div className="bg-zinc-800/60 border border-zinc-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            {hasUsedTrial ? (
              <>
                <p className="text-5xl font-black text-white mb-1">{t.renewal_price}</p>
                <p className="text-zinc-400 text-sm">{t.renewal_sub}</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <span className="text-lg">🎁</span>
                  <span className="text-emerald-400 font-bold text-sm">{t.trial_badge}</span>
                </div>
                <p className="text-5xl font-black text-white mb-1">{t.trial_price}</p>
                <p className="text-zinc-400 text-sm">{t.trial_price_sub}</p>
                <p className="text-zinc-500 text-xs mt-2">{t.trial_after}</p>
              </>
            )}
          </div>

          <ul className="space-y-3 mb-8 text-sm text-zinc-300">
            {features.map(f => (
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
                <label htmlFor="phone" className="block text-sm font-bold text-zinc-300 mb-1.5">
                  {t.phone_label}
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phone_ph}
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center font-bold text-base placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  {t.phone_helper}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!hasUsedTrial && phone.replace(/\D/g, '').length < 9)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
            >
              {loading ? t.cta_loading : hasUsedTrial ? t.cta_renewal : t.cta_trial}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-4">
            {hasUsedTrial ? t.disclaimer_renewal : t.disclaimer_trial}
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-4 w-full text-center text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
        >
          {t.sign_out}
        </button>
      </div>
    </div>
  )
}
