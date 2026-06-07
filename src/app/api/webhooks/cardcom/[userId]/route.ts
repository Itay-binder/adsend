import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getLowProfileResult } from '@/lib/cardcom'
import { sendWhatsAppAlert } from '@/lib/greenapi'

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

  // First subscription row = trial signup, +7 days. Existing row = renewal, +30 days.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  const isTrial = !existing

  const now = new Date()
  const periodEnd = new Date(now)
  if (isTrial) periodEnd.setDate(periodEnd.getDate() + 7)
  else periodEnd.setMonth(periodEnd.getMonth() + 1)

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    status: isTrial ? 'trial' : 'active',
    plan: 'monthly',
    amount: 99,
    currency: 'ILS',
    card_token: token,
    card_exp: tokenExp,
    last_transaction_id: transactionId,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })

  const { data: userInfo } = await supabase.auth.admin.getUserById(userId)
  const email = userInfo?.user?.email ?? 'לא ידוע'
  const dateStr = now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

  await sendWhatsAppAlert(
    isTrial
      ? `🎁 הרשמה חדשה ל-AdSend (ניסיון חינם 7 ימים)\n\nאימייל: ${email}\nתאריך: ${dateStr}`
      : `💳 חידוש מנוי ב-AdSend\n\nאימייל: ${email}\nסכום: 99 ₪ / חודש\nעסקה: ${transactionId ?? '-'}\nתאריך: ${dateStr}`
  )

  return NextResponse.json({ ok: true })
}
