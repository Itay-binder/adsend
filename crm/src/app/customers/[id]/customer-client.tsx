'use client'

import { useState } from 'react'
import { LogIn, MessageCircle, Facebook, CreditCard, RefreshCw, Upload, Trash2 } from 'lucide-react'

type Props = {
  userId: string
  email: string
  fullName: string
  createdAt: string
  lastSignInAt: string | null
  waSession: { phone_number: string | null; status: string; last_seen: string | null } | null
  metaConn: { token_expires_at: string; created_at: string } | null
  adAccounts: { id: string; account_id: string; account_name: string; currency: string; is_active: boolean }[]
  subscription: {
    status: string; plan: string; amount: number; currency: string;
    current_period_start: string | null; current_period_end: string | null;
  } | null
  uploads: {
    id: string; campaign_name: string; adset_name: string; media_type: string;
    status: string; created_at: string;
  }[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const SUB_STATUSES = ['active', 'trial', 'cancelled', 'expired']

export function CustomerClient(props: Props) {
  const [name, setName] = useState(props.fullName)
  const [subStatus, setSubStatus] = useState(props.subscription?.status ?? 'trial')
  const [subPlan, setSubPlan] = useState(props.subscription?.plan ?? 'basic')
  const [subAmount, setSubAmount] = useState(props.subscription?.amount?.toString() ?? '99')
  const [subEnd, setSubEnd] = useState(props.subscription?.current_period_end?.slice(0, 10) ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [impersonating, setImpersonating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    setSaving(true)
    setSavedMsg(null)
    try {
      const res = await fetch(`/api/customers/${props.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          subscription: {
            status: subStatus, plan: subPlan,
            amount: parseFloat(subAmount) || 0,
            current_period_end: subEnd ? new Date(subEnd).toISOString() : null,
          },
        }),
      })
      const data = await res.json()
      if (data.ok) setSavedMsg('נשמר בהצלחה')
      else setSavedMsg(`שגיאה: ${data.error}`)
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(null), 3000)
    }
  }

  async function loginAs() {
    setImpersonating(true)
    try {
      const res = await fetch(`/api/customers/${props.userId}/login-as`, { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        alert(`שגיאה: ${data.error ?? 'לא הצלחתי לייצר קישור'}`)
      }
    } finally {
      setImpersonating(false)
    }
  }

  async function deleteCustomer() {
    if (!confirm(`למחוק לגמרי את ${props.email}? פעולה זו לא הפיכה.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${props.userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        window.location.href = '/customers'
      } else {
        alert(`שגיאה: ${data.error}`)
      }
    } finally {
      setDeleting(false)
    }
  }

  const activeAcct = props.adAccounts.find(a => a.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{name || props.email.split('@')[0]}</h2>
          <p className="text-zinc-400 text-sm mt-1">{props.email}</p>
          <p className="text-zinc-600 text-xs mt-1">
            רשום מאז {fmtDate(props.createdAt)}
            {props.lastSignInAt && ` · התחבר לאחרונה ${fmtDate(props.lastSignInAt)}`}
          </p>
        </div>
        <button
          onClick={loginAs}
          disabled={impersonating}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {impersonating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          התחבר כלקוח
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className={`w-4 h-4 ${props.waSession?.status === 'connected' ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className="text-xs text-zinc-400">WhatsApp</span>
          </div>
          {props.waSession?.phone_number ? (
            <>
              <div className="font-mono text-sm">+{props.waSession.phone_number}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {props.waSession.status === 'connected' ? '✓ מחובר' : 'מנותק'}
                {props.waSession.last_seen && ` · נראה ${fmtDate(props.waSession.last_seen)}`}
              </div>
            </>
          ) : <div className="text-zinc-500 text-sm">לא חובר</div>}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Facebook className={`w-4 h-4 ${props.metaConn ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs text-zinc-400">Meta</span>
          </div>
          {props.metaConn ? (
            <>
              <div className="text-sm">{activeAcct?.account_name ?? 'מחובר'}</div>
              <div className="text-xs text-zinc-500 font-mono mt-1">{activeAcct?.account_id}</div>
              <div className="text-xs text-zinc-600 mt-1">פג ב-{fmtDate(props.metaConn.token_expires_at)}</div>
            </>
          ) : <div className="text-zinc-500 text-sm">לא מחובר</div>}
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-sm">פרטים ומנוי</h3>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">שם מלא</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-500" />
            <span className="font-medium text-sm">מנוי</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">סטטוס</label>
              <select
                value={subStatus} onChange={e => setSubStatus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
              >
                {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">תוכנית</label>
              <input
                type="text" value={subPlan} onChange={e => setSubPlan(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">מחיר (₪/חודש)</label>
              <input
                type="number" value={subAmount} onChange={e => setSubAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">סוף תקופה</label>
              <input
                type="date" value={subEnd} onChange={e => setSubEnd(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
          {savedMsg && <p className="text-xs text-emerald-400">{savedMsg}</p>}
        </div>
      </div>

      {/* Uploads */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-zinc-500" />
          <h3 className="font-semibold text-sm">העלאות אחרונות ({props.uploads.length})</h3>
        </div>
        {props.uploads.length === 0 ? (
          <p className="text-zinc-500 text-sm">אין העלאות עדיין</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {props.uploads.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800/70 rounded-lg p-3 text-sm">
                <div>
                  <div className="font-medium">{u.campaign_name}</div>
                  <div className="text-zinc-500 text-xs">{u.adset_name} · {u.media_type === 'image' ? 'תמונה' : 'סרטון'}</div>
                </div>
                <div className="text-left">
                  <span className={`text-xs px-2 py-1 rounded ${u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {u.status === 'ACTIVE' ? 'פעיל' : 'מושהה'}
                  </span>
                  <div className="text-zinc-600 text-xs mt-1">{fmtDate(u.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-red-400 font-semibold text-sm mb-1">אזור מסוכן</h3>
        <p className="text-zinc-500 text-xs mb-3">מחיקת לקוח מסירה את המשתמש לחלוטין מהמערכת ביחד עם כל המידע שלו.</p>
        <button
          onClick={deleteCustomer}
          disabled={deleting}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          מחק לקוח
        </button>
      </div>
    </div>
  )
}
