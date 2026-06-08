'use client'

import { useEffect } from 'react'
import { trackCustom } from '@/components/meta-pixel'

// Client-side tracker mounted from the (server) dashboard page.
// Fires:
//   - 'dashboard' on every load
//   - 'customer_ready' once per user, the first time we observe both WhatsApp
//      and Meta connected — using localStorage so reloads don't double-count.
export function DashboardTracker({ waConnected, metaConnected }: { waConnected: boolean; metaConnected: boolean }) {
  useEffect(() => {
    trackCustom('dashboard')
    if (waConnected && metaConnected && typeof window !== 'undefined') {
      const KEY = 'adigo_customer_ready_fired'
      if (!localStorage.getItem(KEY)) {
        trackCustom('customer_ready')
        localStorage.setItem(KEY, new Date().toISOString())
      }
    }
  }, [waConnected, metaConnected])
  return null
}
