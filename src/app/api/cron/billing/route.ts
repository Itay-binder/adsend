import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Daily renewal job:
// - Cardcom standing orders do the actual billing — we don't charge anyone here.
// - For each trial/active sub whose period_end has passed AND that Itay didn't
//   manually cancel, we extend +30 days and graduate trials to active.
// - status='cancelled' subs are left alone (the standing order in Cardcom was
//   already stopped by Itay during the cancel-request flow).
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date()
  const nowIso = now.toISOString()

  const { data: due, error } = await supabase
    .from('subscriptions')
    .select('user_id, status, current_period_end')
    .in('status', ['trial', 'active'])
    .lte('current_period_end', nowIso)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const renewed: string[] = []
  for (const sub of due ?? []) {
    const nextEnd = new Date(now)
    nextEnd.setMonth(nextEnd.getMonth() + 1)
    await supabase.from('subscriptions').update({
      status: 'active', // trial → active on first renewal; active stays active
      current_period_start: nowIso,
      current_period_end: nextEnd.toISOString(),
      updated_at: nowIso,
    }).eq('user_id', sub.user_id)
    renewed.push(sub.user_id)
  }

  return NextResponse.json({ renewed: renewed.length, ids: renewed })
}
