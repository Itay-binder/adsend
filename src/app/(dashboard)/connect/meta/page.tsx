'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Plus } from 'lucide-react'

interface AdAccount {
  account_id: string
  account_name: string
  currency: string
  is_active: boolean
}

export default function ConnectMetaPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    fetch('/api/meta/accounts')
      .then(r => r.json())
      .then(d => {
        if (d.accounts?.length) {
          setAccounts(d.accounts)
          setConnected(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function connectMeta() {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_META_REDIRECT_URI ?? `${window.location.origin}/api/meta/oauth/callback`)
    const scopes = encodeURIComponent('ads_management,ads_read,business_management,pages_read_engagement')
    window.location.href = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-2">חיבור Meta Ads</h2>
      <p className="text-zinc-400 mb-8">חבר את חשבון המודעות שלך כדי להעלות קריאייטיבים ישירות</p>

      {connected ? (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Meta מחובר</span>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-zinc-700">
              <p className="text-sm font-medium text-zinc-300">חשבונות מודעות</p>
            </div>
            {accounts.map(acc => (
              <div key={acc.account_id} className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{acc.account_name}</p>
                  <p className="text-zinc-500 text-xs font-mono">{acc.account_id} · {acc.currency}</p>
                </div>
                <Badge className={acc.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}>
                  {acc.is_active ? 'פעיל' : 'כבוי'}
                </Badge>
              </div>
            ))}
          </div>

          <Button onClick={connectMeta} variant="outline" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white">
            <Plus className="w-4 h-4" /> הוסף חשבון נוסף
          </Button>
        </div>
      ) : (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">f</div>
          <h3 className="text-white font-bold text-lg mb-2">חבר Facebook Business</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            לחץ להתחברות עם Facebook — תוכל לבחור איזה חשבונות מודעות לחבר
          </p>
          <Button onClick={connectMeta} className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold px-8 h-11 gap-2">
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            התחבר עם Facebook
          </Button>
        </div>
      )}
    </div>
  )
}
