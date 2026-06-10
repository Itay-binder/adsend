import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'
import { logEvent } from '@/lib/events'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Runs every 5 minutes. Finds users who clicked the subscribe button (= fired
// our 'checkout' event) 15-60 minutes ago, never completed payment (no row in
// subscriptions), and we haven't already alerted on. Sends one WhatsApp ping
// per abandonment and logs 'cart_abandoned_alerted' as the idempotency marker.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = Date.now()
  const fromIso = new Date(now - 60 * 60_000).toISOString()
  const untilIso = new Date(now - 15 * 60_000).toISOString()

  const { data: checkouts, error } = await supabase
    .from('events')
    .select('user_id, created_at, params')
    .eq('name', 'checkout')
    .gte('created_at', fromIso)
    .lte('created_at', untilIso)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  let alerted = 0
  for (const row of checkouts ?? []) {
    if (!row.user_id) continue

    // Skip users who already have a subscription (= they completed payment)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', row.user_id)
      .maybeSingle()
    if (sub) continue

    // Skip users we've already alerted on for this abandonment
    const { data: already } = await supabase
      .from('events')
      .select('id, created_at')
      .eq('user_id', row.user_id)
      .eq('name', 'cart_abandoned_alerted')
      .gte('created_at', row.created_at)
      .maybeSingle()
    if (already) continue

    // Resolve email
    const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id)
    const email = user?.email ?? '—'
    const name = user?.user_metadata?.full_name ?? '—'
    const startedAt = new Date(row.created_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

    await sendWhatsAppAlert(
      `🛒 נטישת עגלה ב-Adigo\n\n` +
      `אימייל: ${email}\n` +
      `שם: ${name}\n` +
      `נכנס לתשלום: ${startedAt}\n` +
      `(הגיע לקארדקום ולא השלים)`,
    )
    await logEvent(row.user_id, 'cart_abandoned_alerted', { email })
    alerted += 1
  }

  return NextResponse.json({ ok: true, scanned: checkouts?.length ?? 0, alerted })
}
