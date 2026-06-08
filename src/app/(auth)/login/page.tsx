'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { trackCustom } from '@/components/meta-pixel'

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    trackCustom('login')
  }, [])

  async function signIn(provider: 'google' | 'facebook') {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      toast.error('שגיאה בהתחברות — נסה שוב')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950">
      <div className="w-full max-w-sm px-6 py-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-center flex flex-col items-center">
          <Image src="/adigo-icon.png" alt="Adigo" width={84} height={84} className="rounded-full shadow-2xl shadow-emerald-500/20 mb-4" priority />
          <h1 className="text-4xl font-black tracking-tight text-white">
            Adi<span className="text-emerald-400">go</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xs">
            30 שניות והקריאייטיבים שלך באוויר.<br />שולחים תמונה לבוט בווצאפ — עלה ישר ל-Meta Ads.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-2xl">🎁</span>
            <div className="text-right">
              <p className="text-emerald-400 font-bold text-sm leading-tight">7 ימי ניסיון חינם</p>
              <p className="text-emerald-400/70 text-xs leading-tight">ביטול בכל עת לפני סוף הניסיון</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full h-12 bg-white text-zinc-900 hover:bg-zinc-100 border-0 font-semibold gap-3"
            onClick={() => signIn('google')}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            המשך עם Google
          </Button>

          <div className="flex items-center gap-3 text-zinc-600 text-xs">
            <div className="flex-1 h-px bg-zinc-800" />
            <span>או</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <Button
            className="w-full h-12 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold gap-3 border-0"
            onClick={() => signIn('facebook')}
            disabled={loading !== null}
          >
            {loading === 'facebook' ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            המשך עם Facebook
          </Button>
        </div>

        <p className="text-xs text-zinc-600 text-center">
          בהתחברות אתה מסכים ל
          <a href="/terms" className="text-zinc-400 hover:text-white mx-1">תנאי השימוש</a>
          ו
          <a href="/privacy" className="text-zinc-400 hover:text-white mx-1">מדיניות הפרטיות</a>
        </p>
      </div>
    </div>
  )
}
