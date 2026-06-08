'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginInner() {
  const params = useSearchParams()
  const denied = params.get('denied')

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/adigo-icon.png" alt="Adigo" width={64} height={64} className="rounded-full mb-3" />
          <h1 className="text-2xl font-bold">
            Adi<span className="text-emerald-400">go</span> <span className="text-zinc-500 text-sm">CRM</span>
          </h1>
        </div>
        <p className="text-zinc-400 text-sm">כניסה לאדמין בלבד</p>
        {denied && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            החשבון הזה לא מורשה לגשת לCRM
          </div>
        )}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          המשך עם Google
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>
}
