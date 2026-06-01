import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  let email: string | undefined
  let transactionId: string | undefined

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    email = body.Email ?? body.email ?? body.CardOwnerEmail
    transactionId = String(body.TranzactionId ?? body.TransactionId ?? body.transactionId ?? '')
  } else {
    // form-encoded (Cardcom default)
    const text = await request.text()
    const params = new URLSearchParams(text)
    email = params.get('Email') ?? params.get('email') ?? params.get('CardOwnerEmail') ?? undefined
    transactionId = params.get('TranzactionId') ?? params.get('TransactionId') ?? undefined
  }

  if (!email) return NextResponse.json({ ok: true })

  const supabase = getSupabase()
  const { data: userData } = await supabase.auth.admin.listUsers()
  const user = userData?.users?.find(u => u.email?.toLowerCase() === email!.toLowerCase())

  if (!user) return NextResponse.json({ ok: true })

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await supabase.from('subscriptions').upsert({
    user_id: user.id,
    status: 'active',
    plan: 'monthly',
    amount: 99,
    currency: 'ILS',
    last_transaction_id: transactionId ? parseInt(transactionId) : null,
    current_period_start: now.toISOString(),
    current_period_end: expiresAt.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true })
}
