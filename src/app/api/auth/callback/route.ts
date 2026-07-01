import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'
import { logEvent } from '@/lib/events'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const localeParam = searchParams.get('locale')
  const nextParam = searchParams.get('next')
  const locale: 'en' | 'he' = localeParam === 'en' ? 'en' : 'he'

  // Where a *new* user lands after signup. English users skip the payment
  // wall entirely and drop straight into the English dashboard; Hebrew users
  // keep the existing trial → Cardcom → /dashboard flow.
  const defaultNext = locale === 'en' ? '/dashboard-en' : '/dashboard'
  const next = nextParam ?? defaultNext

  if (!code) return NextResponse.redirect(`${origin}/lp-${locale === 'en' ? 'en' : 'he'}?error=auth_failed`)

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/lp-${locale === 'en' ? 'en' : 'he'}?error=auth_failed`)

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Persist locale on the user so the bot + subscribe page know which
    // language to speak going forward. Preserve any existing metadata.
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, locale },
    })

    // English funnel: auto-grant an active free subscription so the user
    // gets straight into the product with no payment gate. Idempotent —
    // if a row already exists (returning user, or Founder Pack customer)
    // we leave it alone.
    if (locale === 'en') {
      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!existingSub) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setFullYear(periodEnd.getFullYear() + 10)
        await admin.from('subscriptions').insert({
          user_id: user.id,
          status: 'active',
          plan: 'monthly',
          amount: 0,
          currency: 'USD',
          tier: 'en_beta',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
      }
    }

    // Signup alert (once per user).
    const createdAt = new Date(user.created_at).getTime()
    const ageMs = Date.now() - createdAt
    if (ageMs < 60_000) {
      const { data: already } = await admin
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'signup_alerted')
        .maybeSingle()

      if (!already) {
        const dateStr = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
        await sendWhatsAppAlert(
          `🆕 רישום חדש ל-Adigo (${locale.toUpperCase()})\n\n` +
          `אימייל: ${user.email ?? '—'}\n` +
          `שם: ${user.user_metadata?.full_name ?? '—'}\n` +
          `שעה: ${dateStr}`,
        )
        await logEvent(user.id, 'signup_alerted', { email: user.email, locale })
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
