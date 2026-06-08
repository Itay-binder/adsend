'use client'

import { useState } from 'react'
import { Send, RefreshCw, CheckCircle, XCircle, Users } from 'lucide-react'

type Recipient = { id: string; email: string; fullName: string | null; phone: string }

export function BroadcastClient({ recipients }: { recipients: Recipient[] }) {
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(recipients.map(r => r.id)))
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<{ phone: string; ok: boolean; error?: string }[] | null>(null)

  const targets = recipients.filter(r => selected.has(r.id))

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === recipients.length) setSelected(new Set())
    else setSelected(new Set(recipients.map(r => r.id)))
  }

  async function send() {
    if (!message.trim()) return
    if (!confirm(`לשלוח הודעה ל-${targets.length} לקוחות?`)) return

    setSending(true)
    setResults(null)
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          phones: targets.map(t => t.phone),
        }),
      })
      const data = await res.json()
      setResults(data.results ?? [])
    } catch (e) {
      alert('שגיאה בשליחה')
    } finally {
      setSending(false)
    }
  }

  const successCount = results?.filter(r => r.ok).length ?? 0
  const failCount = results?.filter(r => !r.ok).length ?? 0

  return (
    <div className="space-y-6">
      {/* Message editor */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3">
        <label className="text-sm font-medium">הודעה</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
          placeholder="כתוב את ההודעה שתישלח לכל הנמענים..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-zinc-600"
        />
        <p className="text-xs text-zinc-500">{message.length} תווים · נשלח דרך GreenAPI מהמספר הראשי</p>
      </div>

      {/* Recipients selector */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="font-medium text-sm">נמענים ({selected.size}/{recipients.length})</span>
          </div>
          <button
            onClick={toggleAll}
            className="text-xs text-brand hover:text-brand/90"
          >
            {selected.size === recipients.length ? 'בטל הכל' : 'בחר הכל'}
          </button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {recipients.map(r => (
            <label key={r.id} className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="accent-emerald-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{r.fullName ?? r.email.split('@')[0]}</div>
                <div className="text-xs text-zinc-500 font-mono">+{r.phone}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={send}
        disabled={sending || !message.trim() || targets.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-medium transition-colors"
      >
        {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'שולח...' : `שלח ל-${targets.length} נמענים`}
      </button>

      {/* Results */}
      {results && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1.5 text-brand">
              <CheckCircle className="w-4 h-4" />
              {successCount} נשלחו
            </div>
            {failCount > 0 && (
              <div className="flex items-center gap-1.5 text-red-400">
                <XCircle className="w-4 h-4" />
                {failCount} נכשלו
              </div>
            )}
          </div>
          {failCount > 0 && (
            <div className="space-y-1 text-xs">
              {results.filter(r => !r.ok).map((r, i) => (
                <div key={i} className="text-red-400/80 font-mono">
                  +{r.phone}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
