import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Best-effort: never throws. If logging fails we just swallow the error so
// the caller (webhook / API route / cron) is never disturbed by analytics.
export async function logEvent(userId: string | null, name: string, params: Record<string, unknown> = {}) {
  if (!userId) return
  try {
    await adminClient().from('events').insert({ user_id: userId, name, params })
  } catch (e) {
    console.error(`[events] failed to log ${name} for ${userId}:`, (e as Error).message)
  }
}

// Allowed event names — keeps the table clean and gives us autocomplete.
// Extend as we add more events.
export type EventName =
  | 'login'
  | 'welcome'
  | 'checkout'
  | 'purchase'
  | 'subscribe'
  | 'dashboard'
  | 'whatsapp_connection'
  | 'whatsapp_disconnect'
  | 'meta_connection'
  | 'customer_ready'
  | 'upload_created'
  | 'cancel_request'
  | string // allow arbitrary names so we don't have to redeploy for new events
