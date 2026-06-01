import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getLowProfileResult } from '@/lib/cardcom'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const body = await request.json().catch(() => request.text())

  // Cardcom posts the LowProfileId in the webhook body
  const lowProfileId = (body as Record<string, string>)?.lowprofileid || (body as Record<string, string>)?.LowProfileId

  if (!lowProfileId) {
    return NextResponse.json({ ok: true })
  }

  const result = await getLowProfileResult(lowProfileId)

  if (result?.ResponseCode !== 0) {
    return NextResponse.json({ ok: true })
  }

  const token = result.TokenInfo?.Token
  const tokenExp = result.TokenInfo?.TokenExDate
  const transactionId = result.TranzactionId

  const supabase = getSupabase()
  const now = new Date()
  const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    status: 'active',
    plan: 'monthly',
    amount: 99,
    currency: 'ILS',
    card_token: token,
    card_exp: tokenExp,
    last_transaction_id: transactionId,
    current_period_start: now.toISOString(),
    current_period_end: expiresAt,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true })
}
