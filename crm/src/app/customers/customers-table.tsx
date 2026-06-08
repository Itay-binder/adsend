'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MessageCircle, Facebook, Search, ExternalLink } from 'lucide-react'
import type { Customer } from '@/lib/customers'

const SUB_LABELS: Record<string, { label: string; cls: string }> = {
  active:    { label: 'פעיל',    cls: 'bg-brand/15 text-brand' },
  trial:     { label: 'ניסיון',  cls: 'bg-blue-500/15 text-blue-400' },
  cancelled: { label: 'בוטל',   cls: 'bg-amber-500/15 text-amber-400' },
  expired:   { label: 'פג תוקף', cls: 'bg-red-500/15 text-red-400' },
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return customers
    return customers.filter(c =>
      c.email.toLowerCase().includes(s) ||
      c.fullName?.toLowerCase().includes(s) ||
      c.waPhone?.includes(s) ||
      c.adAccountName?.toLowerCase().includes(s)
    )
  }, [customers, q])

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="חיפוש לפי אימייל, שם, טלפון, חשבון..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pr-10 pl-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-xs">
              <th className="text-right p-3 font-medium">לקוח</th>
              <th className="text-right p-3 font-medium">WhatsApp</th>
              <th className="text-right p-3 font-medium">Meta</th>
              <th className="text-right p-3 font-medium">חשבון מודעות</th>
              <th className="text-right p-3 font-medium">מנוי</th>
              <th className="text-right p-3 font-medium">העלאות (חודש/סה״כ)</th>
              <th className="text-right p-3 font-medium">פעילות אחרונה</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const sub = c.subStatus ? SUB_LABELS[c.subStatus] : null
              return (
                <tr key={c.id} className="border-t border-zinc-800/70 hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">{c.fullName ?? c.email.split('@')[0]}</div>
                    <div className="text-zinc-500 text-xs">{c.email}</div>
                  </td>
                  <td className="p-3">
                    {c.waPhone ? (
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className={`w-3.5 h-3.5 ${c.waStatus === 'connected' ? 'text-brand' : 'text-zinc-500'}`} />
                        <span className="font-mono text-xs">+{c.waPhone}</span>
                      </div>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="p-3">
                    {c.metaConnected ? (
                      <Facebook className="w-3.5 h-3.5 text-blue-400" />
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="p-3">
                    {c.adAccountName ? (
                      <div>
                        <div className="text-xs">{c.adAccountName}</div>
                        <div className="text-zinc-600 text-xs font-mono">{c.adAccountId}</div>
                      </div>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="p-3">
                    {sub ? (
                      <span className={`text-xs px-2 py-1 rounded ${sub.cls}`}>{sub.label}</span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{c.uploadsThisMonth}</span>
                    <span className="text-zinc-600"> / {c.uploadsTotal}</span>
                  </td>
                  <td className="p-3 text-zinc-400">{fmtDate(c.lastUploadAt ?? c.lastSignInAt)}</td>
                  <td className="p-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-1 text-brand hover:text-brand/90 text-xs font-medium"
                    >
                      פתח <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-zinc-500">אין תוצאות</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
