import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { chargeToken } from '@/lib/cardcom'
import { sendWhatsAppAlert } from '@/lib/greenapi'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Daily billing job:
// - trial expired → charge ₪99 via stored token → active for 30 days; on failure → expired
// - active expired → charge ₪99 → extend 30 days; on failure → expired
export async function GET(request: Request) {
  // Vercel Cron sends a Bearer token via Authorization header. Verify it.
  const authHeader = request.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date()
  const nowIso = now.toISOString()

  // Pull subscriptions due for billing (trial or active, period_end ≤ now, has a token)
  const { data: due, error } = await supabase
    .from('subscriptions')
    .select('user_id,status,amount,card_token,card_exp,current_period_end')
    .in('status', ['trial', 'active'])
    .lte('current_period_end', nowIso)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: userMap } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const usersByid = new Map(userMap?.users?.map(u => [u.id, u]) ?? [])

  const results: { user_id: string; outcome: 'charged' | 'expired' | 'skipped'; error?: string }[] = []

  for (const sub of due ?? []) {
    const user = usersByid.get(sub.user_id)
    const email = user?.email
    const name = (user?.user_metadata?.full_name as string) ?? undefined

    if (!sub.card_token || !sub.card_exp) {
      // No payment method on file — expire
      await supabase.from('subscriptions').update({
        status: 'expired', updated_at: nowIso,
      }).eq('user_id', sub.user_id)
      results.push({ user_id: sub.user_id, outcome: 'expired', error: 'no card_token' })
      if (email) await sendWhatsAppAlert(`⚠️ AdSend: ${email} פג תוקף ללא אמצעי תשלום שמור`)
      continue
    }

    try {
      const { transactionId } = await chargeToken(sub.card_token, sub.card_exp, email, name)
      const nextEnd = new Date(now)
      nextEnd.setMonth(nextEnd.getMonth() + 1)
      await supabase.from('subscriptions').update({
        status: 'active',
        last_transaction_id: transactionId,
        current_period_start: nowIso,
        current_period_end: nextEnd.toISOString(),
        updated_at: nowIso,
      }).eq('user_id', sub.user_id)
      results.push({ user_id: sub.user_id, outcome: 'charged' })
      const becameActive = sub.status === 'trial' ? ' (סוף ניסיון)' : ' (חידוש חודשי)'
      if (email) await sendWhatsAppAlert(`💳 AdSend חיוב מוצלח: ${email} — ₪${sub.amount}${becameActive}`)
    } catch (e) {
      const msg = (e as Error).message
      await supabase.from('subscriptions').update({
        status: 'expired', updated_at: nowIso,
      }).eq('user_id', sub.user_id)
      results.push({ user_id: sub.user_id, outcome: 'expired', error: msg })
      if (email) await sendWhatsAppAlert(`❌ AdSend חיוב נכשל: ${email} — ${msg.slice(0, 100)}`)
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
