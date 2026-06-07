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

  // Deactivate all existing accounts for this user, then upsert the chosen one as active
  await supabase.from('ad_accounts').update({ is_active: false }).eq('user_id', user.id)
  const { error } = await supabase.from('ad_accounts').upsert({
    user_id: user.id,
    account_id,
    account_name,
    currency: currency ?? 'ILS',
    is_active: true,
  }, { onConflict: 'user_id,account_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
