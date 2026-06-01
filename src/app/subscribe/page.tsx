'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/cardcom/create-payment', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            Ad<span className="text-emerald-400">Send</span>
          </h1>
          <p className="text-zinc-400">תקופת הניסיון הסתיימה</p>
        </div>

        <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-8">
          <div className="text-center mb-6">
            <p className="text-5xl font-black text-white mb-1">₪99</p>
            <p className="text-zinc-400 text-sm">לחודש · ביטול בכל עת</p>
          </div>

          <ul className="space-y-3 mb-8 text-sm text-zinc-300">
            {[
              'העלאת קריאייטיבים ישירות מווצאפ',
              'חיבור לכל חשבון Meta Ads',
              'בוט AI שמבין עברית חופשית',
              'היסטוריית העלאות',
              'ניסיון חינם 7 ימים למצטרפים חדשים',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold text-base transition-colors"
          >
            {loading ? 'מעביר לתשלום...' : 'לתשלום מאובטח'}
          </button>

          <p className="text-center text-zinc-600 text-xs mt-4">
            תשלום מאובטח דרך Cardcom · SSL מוצפן
          </p>
        </div>
      </div>
    </div>
  )
}
