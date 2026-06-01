import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('ad_accounts').select('*').eq('user_id', user.id)
  return NextResponse.json({ accounts: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_id, account_name, currency } = await request.json()
  if (!account_id || !account_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Replace any existing accounts with the single selected one
  await supabase.from('ad_accounts').delete().eq('user_id', user.id)
  const { error } = await supabase.from('ad_accounts').insert({
    user_id: user.id,
    account_id,
    account_name,
    currency: currency ?? 'ILS',
    is_active: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
