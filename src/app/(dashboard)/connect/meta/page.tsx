'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, RefreshCw } from 'lucide-react'
import { trackCustom } from '@/components/meta-pixel'

interface AdAccount {
  id?: string
  account_id?: string
  account_name: string
  currency: string
  account_status?: number
  is_active?: boolean
}

export default function ConnectMetaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isChoosing = searchParams.get('choose') === '1'
  const justConnected = searchParams.get('just_connected') === '1'

  // Fire meta_connection event on the first hit back from OAuth callback,
  // dedupe with localStorage so accidental reloads don't double-count.
  useEffect(() => {
    if (justConnected && typeof window !== 'undefined') {
      const KEY = 'adigo_meta_connection_fired'
      if (!localStorage.getItem(KEY)) {
        trackCustom('meta_connection')
        localStorage.setItem(KEY, new Date().toISOString())
      }
    }
  }, [justConnected])

  const [connected, setConnected] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null)
  const [availableAccounts, setAvailableAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isChoosing) {
      // Fetch available accounts from Meta
      fetch('/api/meta/available-accounts')
        .then(r => r.json())
        .then(async d => {
          if (!d.accounts) { setError(d.error ?? 'שגיאה בטעינת חשבונות'); setLoading(false); return }
          if (d.accounts.length === 1) {
            // Auto-select if only one account
            await selectAccount(d.accounts[0])
          } else {
            setAvailableAccounts(d.accounts)
            setLoading(false)
          }
        })
        .catch(() => { setError('שגיאה בטעינת חשבונות'); setLoading(false) })
    } else {
      fetch('/api/meta/accounts')
        .then(r => r.json())
        .then(d => {
          if (d.accounts?.length) {
            setSelectedAccount(d.accounts[0])
            setConnected(true)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [isChoosing])

  async function selectAccount(acc: AdAccount) {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/meta/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: acc.account_id,
        account_name: acc.account_name,
        currency: acc.currency,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSelectedAccount(acc)
      setConnected(true)
      setAvailableAccounts([])
      router.replace('/connect/meta')
    } else {
      const d = await res.json()
      setError(d.error ?? 'שגיאה בשמירה')
      setLoading(false)
    }
  }

  function connectMeta() {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_META_REDIRECT_URI ?? `${window.location.origin}/api/meta/oauth/callback`)
    const scopes = encodeURIComponent('ads_management,ads_read,business_management,pages_read_engagement')
    window.location.href = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`
  }

  if (loading || saving) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  // Account picker after OAuth
  if (isChoosing) return (
    <div className="p-8 max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-2">בחר חשבון מודעות</h2>
      <p className="text-zinc-400 mb-8">בחר את החשבון שממנו תעלה קריאייטיבים</p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {availableAccounts.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 text-center text-zinc-400">
          לא נמצאו חשבונות מודעות פעילים בחשבון זה
        </div>
      ) : (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden">
          {availableAccounts.map(acc => (
            <button
              key={acc.account_id}
              onClick={() => selectAccount(acc)}
              disabled={saving}
              className="w-full px-4 py-4 flex items-center justify-between border-b border-zinc-800 last:border-0 hover:bg-zinc-700/50 transition-colors text-right disabled:opacity-50"
            >
              <div className="text-right">
                <p className="text-white text-sm font-medium">{acc.account_name}</p>
                <p className="text-zinc-500 text-xs font-mono mt-0.5">{acc.account_id} · {acc.currency}</p>
              </div>
              <span className="text-zinc-400 text-sm mr-4">← בחר</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Already connected — show selected account
  if (connected && selectedAccount) return (
    <div className="p-8 max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-2">חיבור Meta Ads</h2>
      <p className="text-zinc-400 mb-8">חשבון המודעות המחובר</p>

      <div className="flex items-center gap-2 mb-5">
        <CheckCircle className="w-5 h-5 text-brand" />
        <span className="text-brand font-medium">Meta מחובר</span>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 flex items-center justify-between mb-4">
        <div>
          <p className="text-white text-sm font-medium">{selectedAccount.account_name}</p>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{selectedAccount.account_id} · {selectedAccount.currency}</p>
        </div>
        <Badge className="bg-brand/20 text-brand">פעיל</Badge>
      </div>

      <Button onClick={connectMeta} variant="outline" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white">
        <RefreshCw className="w-4 h-4" /> החלף חשבון
      </Button>
    </div>
  )

  // Not connected
  return (
    <div className="p-8 max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-2">חיבור Meta Ads</h2>
      <p className="text-zinc-400 mb-8">חבר את חשבון המודעות שלך כדי להעלות קריאייטיבים ישירות</p>

      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">f</div>
        <h3 className="text-white font-bold text-lg mb-2">חבר Facebook Business</h3>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          לחץ להתחברות עם Facebook — תוכל לבחור איזה חשבון מודעות לחבר
        </p>
        <Button onClick={connectMeta} className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold px-8 h-11 gap-2">
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          התחבר עם Facebook
        </Button>
      </div>
    </div>
  )
}
