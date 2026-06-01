'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribeSuccessPage() {
  const [done, setDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/cardcom/activate', { method: 'POST' })
      .finally(() => setDone(true))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-white mb-2">ברוך הבא לAdSend!</h1>
        <p className="text-zinc-400 mb-8">המנוי פעיל. אפשר לחבר ווצאפ ולהתחיל להעלות קריאייטיבים.</p>
        <button
          onClick={() => router.push('/dashboard')}
          disabled={!done}
          className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold transition-colors"
        >
          {done ? 'לדשבורד' : 'רגע...'}
        </button>
      </div>
    </div>
  )
}
