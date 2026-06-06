import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.status === 'cancelled' || sub.status === 'expired') {
    return NextResponse.json({ error: 'אין מנוי פעיל לביטול' }, { status: 400 })
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
