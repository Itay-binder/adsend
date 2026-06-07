'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, LogOut, AlertCircle, CheckCircle, Clock } from 'lucide-react'

type Sub = {
  status: string
  plan: string
  amount: number
  currency: string
  current_period_start: string | null
  current_period_end: string | null
} | null

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'מנוי פעיל',     color: 'text-emerald-400' },
  trial:     { label: 'בתקופת ניסיון', color: 'text-blue-400' },
  cancelled: { label: 'בוטל',          color: 'text-amber-400' },
  expired:   { label: 'פג תוקף',       color: 'text-red-400' },
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function SettingsClient({ email, subscription }: { email: string; subscription: Sub }) {
  const router = useRouter()
  const supabase = createClient()
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const s = subscription
  const statusInfo = s ? (STATUS_LABELS[s.status] ?? { label: s.status, color: 'text-zinc-400' }) : null
  const canCancel = s && (s.status === 'active' || s.status === 'trial') && !cancelled

  async function handleCancel() {
    if (!confirm('כדי לבטל את המנוי תועבר/י לשיחת WhatsApp עם הנציג שלנו. להמשיך?')) return
    setCancelling(true)
    setError(null)
    try {
      // Fire-and-forget — let Itay know a cancel request came in
      fetch('/api/subscription/cancel-request', { method: 'POST' }).catch(() => {})
      const text = encodeURIComponent(
        `היי, אני רוצה לבטל את המנוי שלי ב-AdSend.\nאימייל: ${email}`
      )
      window.location.href = `https://wa.me/972526660006?text=${text}`
    } catch {
      setError('שגיאה — נסה שוב')
      setCancelling(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-4">
      {/* Account */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-3">
        <h3 className="text-white font-semibold text-sm">חשבון</h3>
        <p className="text-zinc-400 text-sm">{email}</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'מתנתק...' : 'התנתקות'}
        </button>
      </div>

      {/* Subscription */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-zinc-400" />
          <h3 className="text-white font-semibold text-sm">מנוי</h3>
        </div>

        {!s ? (
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>אין מנוי פעיל</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">סטטוס</span>
              <span className={statusInfo?.color ?? 'text-zinc-300'}>
                {cancelled ? 'בוטל' : statusInfo?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">תוכנית</span>
              <span className="text-zinc-300">
                {s.status === 'trial'
                  ? `7 ימי ניסיון חינם · אח״כ ${s.amount} ${s.currency} / חודש`
                  : `${s.amount} ${s.currency} / חודש`}
              </span>
            </div>
            {s.current_period_start && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  {s.status === 'trial' ? 'תחילת ניסיון' : 'תחילת תקופה'}
                </span>
                <span className="text-zinc-300">{fmt(s.current_period_start)}</span>
              </div>
            )}
            {s.current_period_end && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  {cancelled || s.status === 'cancelled'
                    ? 'גישה עד'
                    : s.status === 'trial' ? 'סוף ניסיון · חיוב ראשון' : 'חידוש חודשי'}
                </span>
                <span className="text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fmt(s.current_period_end)}
                </span>
              </div>
            )}

            {(cancelled || s.status === 'cancelled') && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400 text-xs">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                המנוי בוטל — הגישה פעילה עד {fmt(s.current_period_end)}
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-zinc-600 hover:text-red-400 transition-colors mt-2"
              >
                {cancelling ? 'מבטל...' : 'ביטול מנוי'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
