'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/components/meta-pixel'

export default function SubscribeSuccessPage() {
  const [done, setDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fire the conversion to Meta Pixel — value=0 because we capture the card
    // on the trial signup; the real ₪99 charge happens after 7 days.
    trackEvent('Subscribe', { value: 0, currency: 'ILS', predicted_ltv: 99 })
    trackEvent('CompleteRegistration', { content_name: 'Adigo Trial' })
    fetch('/api/cardcom/activate', { method: 'POST' })
      .finally(() => setDone(true))
  }, [])

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-white mb-2">ברוך הבא ל-Adigo!</h1>
        <p className="text-zinc-400 mb-8">המנוי פעיל. אפשר לחבר ווצאפ ולהתחיל להעלות קריאייטיבים.</p>
        <button
          onClick={() => router.push('/dashboard')}
          disabled={!done}
          className="inline-block px-6 py-3 rounded-xl bg-brand hover:bg-[#00B8AF] disabled:bg-zinc-700 text-[#0B1220] font-bold transition-colors"
        >
          {done ? 'לדשבורד' : 'רגע...'}
        </button>
      </div>
    </div>
  )
}
