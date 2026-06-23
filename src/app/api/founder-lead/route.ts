import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'

function normalizeIsraeliMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^05\d{8}$/.test(digits)) return digits
  if (/^9725\d{8}$/.test(digits)) return '0' + digits.slice(3)
  return null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { name?: string; phone?: string }
  const name = (body.name ?? '').trim()
  const phone = body.phone ? normalizeIsraeliMobile(body.phone) : null

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'שם חובה' }, { status: 400 })
  }
  if (!phone) {
    return NextResponse.json({ error: 'מספר טלפון לא תקין' }, { status: 400 })
  }

  // Best-effort DB write — if the founder_leads table isn't migrated yet,
  // the WhatsApp ping still goes out so leads aren't lost.
  try {
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const ua = request.headers.get('user-agent') ?? null
    await admin.from('founder_leads').insert({ name, phone, user_agent: ua })
  } catch {}

  const intl = '972' + phone.slice(1)
  const dateStr = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

  await sendWhatsAppAlert(
    `🔥 ליד חדש ל-Founder Pack\n\n` +
    `שם: ${name}\n` +
    `טלפון: ${phone}\n` +
    `שעה: ${dateStr}\n\n` +
    `📱 וואצפ: https://wa.me/${intl}\n` +
    `📞 חיוג: tel:+${intl}`,
  )

  return NextResponse.json({ ok: true })
}
