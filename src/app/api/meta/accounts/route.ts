import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AccountInput = { account_id: string; account_name: string; currency?: string }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data }, { data: sub }] = await Promise.all([
    supabase.from('ad_accounts').select('*').eq('user_id', user.id),
    supabase.from('subscriptions').select('tier').eq('user_id', user.id).maybeSingle(),
  ])
  return NextResponse.json({ accounts: data ?? [], tier: sub?.tier ?? 'basic' })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Agency subscribers may save several accounts at once via `accounts: [...]`.
  // Basic subscribers send a single account (account_id/account_name/currency).
  const incoming: AccountInput[] = Array.isArray(body.accounts)
    ? body.accounts
    : [{ account_id: body.account_id, account_name: body.account_name, currency: body.currency }]

  const valid = incoming.filter(a => a?.account_id && a?.account_name)
  if (!valid.length) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Agency can keep multiple accounts active; basic is limited to one.
  const { data: sub } = await supabase.from('subscriptions').select('tier').eq('user_id', user.id).maybeSingle()
  const isAgency = sub?.tier === 'agency'
  const selected = isAgency ? valid : valid.slice(0, 1)

  // Deactivate everything, then (re)activate exactly the chosen set.
  await supabase.from('ad_accounts').update({ is_active: false }).eq('user_id', user.id)
  const { error } = await supabase.from('ad_accounts').upsert(
    selected.map(a => ({
      user_id: user.id,
      account_id: a.account_id,
      account_name: a.account_name,
      currency: a.currency ?? 'ILS',
      is_active: true,
    })),
    { onConflict: 'user_id,account_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
