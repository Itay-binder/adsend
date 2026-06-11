import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'
import { logEvent } from '@/lib/events'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function buildGmailUrl(to: string, name: string): string {
  const subject = `היי ${name}, שאלה קצרה ממני — איתי מ-Adigo`
  const body =
    `היי ${name},\n` +
    `זה איתי בינדר, המפתח של Adigo.\n` +
    `ראיתי שביקרת אצלנו במערכת ולא השלמת את ההרשמה.\n\n` +
    `רציתי לבדוק איתך אם אתה צריך עזרה?\n` +
    `נשמח לראות אותך משתמש במוצר שלנו (https://adsend.vercel.app) וגם לקבל פידבק ולשפר אותו בהתאם.\n\n` +
    `נ.ב — אם מה שעצר אותך זה דרישת פרטי האשראי, חשוב שתדע: לא מחויב שקל במהלך 7 ימי הניסיון. האשראי נשמר רק כדי שהחיוב יוכל להתחיל אוטומטית אחרי הניסיון אם תרצה להמשיך. אפשר לבטל בלחיצת כפתור בכל רגע.\n\n` +
    `תודה,\n` +
    `איתי`
  return (
    `https://mail.google.com/mail/u/itay@binder.co.il/?view=cm&fs=1` +
    `&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  )
}

// Runs every 5 minutes from baileys-server (Railway). Finds users who clicked
// the subscribe button 15-60 minutes ago, never completed payment, and we
// haven't alerted on yet. Sends ONE WhatsApp ping with phone + Gmail compose
// link, and uses 'cart_abandoned_alerted' as the idempotency marker.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = Date.now()
  const fromIso = new Date(now - 60 * 60_000).toISOString()
  const untilIso = new Date(now - 15 * 60_000).toISOString()

  const { data: checkouts, error } = await supabase
    .from('events')
    .select('user_id, created_at')
    .eq('name', 'checkout')
    .gte('created_at', fromIso)
    .lte('created_at', untilIso)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  let alerted = 0
  for (const row of checkouts ?? []) {
    if (!row.user_id) continue

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', row.user_id)
      .maybeSingle()
    if (sub) continue

    const { data: already } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', row.user_id)
      .eq('name', 'cart_abandoned_alerted')
      .gte('created_at', row.created_at)
      .maybeSingle()
    if (already) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id)
    if (!user?.email) continue
    const email = user.email
    const name = user.user_metadata?.full_name ?? '—'
    const firstName = (user.user_metadata?.full_name ?? '').split(' ')[0] || name
    const phone = user.user_metadata?.phone as string | undefined
    const phoneIntl = phone
      ? (phone.startsWith('0') ? '972' + phone.slice(1) : phone)
      : null
    const startedAt = new Date(row.created_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

    const lines = [
      `🛒 נטישת עגלה ב-Adigo`,
      ``,
      `שם: ${name}`,
      `אימייל: ${email}`,
      phone ? `טלפון: 0${phone.startsWith('0') ? phone.slice(1) : phone.slice(3)}` : null,
      `נכנס לתשלום: ${startedAt}`,
      `(הגיע לקארדקום ולא השלים)`,
      ``,
      phoneIntl ? `📱 וואצפ: https://wa.me/${phoneIntl}` : null,
      `📧 שלח מייל: ${buildGmailUrl(email, firstName)}`,
    ].filter(Boolean)

    await sendWhatsAppAlert(lines.join('\n'))
    await logEvent(row.user_id, 'cart_abandoned_alerted', { email, phone })
    alerted += 1
  }

  return NextResponse.json({ ok: true, scanned: checkouts?.length ?? 0, alerted })
}
