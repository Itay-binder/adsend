import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppAlert } from '@/lib/greenapi'

// User pressed "Cancel" in settings. We don't actually cancel — instead we
// ping Itay's WhatsApp so he can talk to the customer first and revoke the
// standing order in Cardcom manually.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, amount, plan')
    .eq('user_id', user.id)
    .maybeSingle()

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const fullName = (user.user_metadata?.full_name as string) ?? ''

  await sendWhatsAppAlert(
    `⚠️ AdSend — לקוח ביקש לבטל מנוי\n\n` +
    `שם: ${fullName || '(לא צוין)'}\n` +
    `אימייל: ${user.email}\n` +
    `סטטוס: ${sub?.status ?? 'אין מנוי'}\n` +
    `תוקף עד: ${periodEnd}\n` +
    `סכום: ${sub?.amount ?? 0} ₪ / ${sub?.plan ?? 'חודש'}\n\n` +
    `→ דבר איתו ב-WhatsApp ובטל ידנית את הוראת הקבע ב-Cardcom`
  )

  return NextResponse.json({ ok: true })
}
