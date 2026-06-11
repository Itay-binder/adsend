import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'
import { logEvent } from '@/lib/events'

// Israeli mobile: 050/051/052/053/054/055/058/059 + 7 digits.
// Accepts dashes/spaces/parens in input, validates the digits-only form.
function normalizeIsraeliMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^05\d{8}$/.test(digits)) return digits
  if (/^9725\d{8}$/.test(digits)) return '0' + digits.slice(3)
  if (/^\+?9725\d{8}$/.test(raw)) return '0' + digits.slice(3)
  return null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { phone?: string }
  const phone = body.phone ? normalizeIsraeliMobile(body.phone) : null
  if (!phone) return NextResponse.json({ error: 'מספר טלפון לא תקין' }, { status: 400 })

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, phone },
  })

  // Send WhatsApp ping ONCE per user. Guard with phone_provided event.
  const { data: already } = await admin
    .from('events')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'phone_alerted')
    .maybeSingle()

  if (!already) {
    const name = user.user_metadata?.full_name ?? '—'
    const dateStr = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
    const intl = phone.startsWith('0') ? '972' + phone.slice(1) : phone
    await sendWhatsAppAlert(
      `📞 לקוח חדש הזין טלפון ב-Adigo\n\n` +
      `שם: ${name}\n` +
      `אימייל: ${user.email}\n` +
      `טלפון: 0${phone.startsWith('0') ? phone.slice(1) : phone.slice(3)}\n` +
      `שעה: ${dateStr}\n\n` +
      `שלח לו וואטסאפ: https://wa.me/${intl}`,
    )
    await logEvent(user.id, 'phone_alerted', { phone })
  }

  await logEvent(user.id, 'phone_provided', { phone })
  return NextResponse.json({ ok: true })
}
