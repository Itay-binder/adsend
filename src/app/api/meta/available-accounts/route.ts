import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdAccounts } from '@/lib/meta/api'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: conn }, { data: sub }] = await Promise.all([
    supabase.from('meta_connections').select('access_token').eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('tier').eq('user_id', user.id).maybeSingle(),
  ])

  if (!conn?.access_token) return NextResponse.json({ error: 'Not connected' }, { status: 400 })

  const tier = sub?.tier ?? 'basic'

  try {
    const accounts = await getAdAccounts(conn.access_token)
    const active = accounts.filter(a => a.account_status === 1).map(a => ({
      account_id: a.id,
      account_name: a.name,
      currency: a.currency,
    }))
    return NextResponse.json({ accounts: active, tier })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
