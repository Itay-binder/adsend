import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  let email: string | undefined
  let transactionId: string | undefined
  let cardToken: string | undefined
  let cardExp: string | undefined
  let amount: number = 0

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    email = body.Email ?? body.email ?? body.CardOwnerEmail ?? body.UIValues?.CardOwnerEmail
    transactionId = String(body.TranzactionId ?? body.TransactionId ?? body.transactionId ?? '')
    cardToken = body.Token ?? body.TokenInfo?.Token
    const monthY = body.UIValues?.CardMonth
    const yearY = body.UIValues?.CardYear
    const uiExp = (monthY && yearY) ? `${String(monthY).padStart(2, '0')}${String(yearY).slice(-2)}` : undefined
    cardExp = body.CardExpirationMMYY ?? body.TokenInfo?.CardExpirationMMYY ?? uiExp
    amount = Number(body.Amount ?? body.TranzactionInfo?.Amount ?? 0)
  } else {
    const text = await request.text()
    const params = new URLSearchParams(text)
    email = params.get('Email') ?? params.get('email') ?? params.get('CardOwnerEmail') ?? undefined
    transactionId = params.get('TranzactionId') ?? params.get('TransactionId') ?? undefined
    cardToken = params.get('Token') ?? undefined
    cardExp = params.get('CardExpirationMMYY') ?? undefined
    amount = Number(params.get('Amount') ?? 0)
  }

  if (!email) return NextResponse.json({ ok: true })

  const supabase = getSupabase()
  const { data: userData } = await supabase.auth.admin.listUsers()
  const user = userData?.users?.find(u => u.email?.toLowerCase() === email!.toLowerCase())

  if (!user) return NextResponse.json({ ok: true })

  const now = new Date()
  const periodEnd = new Date(now)
  const isTrial = amount === 0
  if (isTrial) periodEnd.setDate(periodEnd.getDate() + 7)
  else periodEnd.setMonth(periodEnd.getMonth() + 1)

  await supabase.from('subscriptions').upsert({
    user_id: user.id,
    status: isTrial ? 'trial' : 'active',
    plan: 'monthly',
    amount: 99, // billed price after trial
    currency: 'ILS',
    card_token: cardToken ?? undefined,
    card_exp: cardExp ?? undefined,
    last_transaction_id: transactionId && transactionId !== '0' ? parseInt(transactionId) : null,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })

  const dateStr = now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
  await sendWhatsAppAlert(
    isTrial
      ? `🎁 הרשמה חדשה ל-AdSend (ניסיון חינם)\n\nאימייל: ${email}\nניסיון: 7 ימים\nתאריך: ${dateStr}`
      : `💳 לקוח חדש ב-AdSend!\n\nאימייל: ${email}\nסכום: 99 ₪ / חודש\nעסקה: ${transactionId ?? '-'}\nתאריך: ${dateStr}`
  )

  return NextResponse.json({ ok: true })
}
