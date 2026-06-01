import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if already active
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const alreadyActive = existing?.status === 'active' &&
    existing?.current_period_end &&
    new Date(existing.current_period_end) > new Date()

  if (alreadyActive) return NextResponse.json({ ok: true })

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await admin.from('subscriptions').upsert({
    user_id: user.id,
    status: 'active',
    plan: 'monthly',
    amount: 99,
    currency: 'ILS',
    current_period_start: now.toISOString(),
    current_period_end: expiresAt.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true })
}
