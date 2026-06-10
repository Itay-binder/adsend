import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { sendWhatsAppAlert } from '@/lib/greenapi'
import { logEvent } from '@/lib/events'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  // Fire signup alert ONCE per user. We detect first login by checking if the
  // account was created in the last 60 seconds AND we haven't already alerted.
  // Idempotency guard = the 'signup_alerted' event row.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const createdAt = new Date(user.created_at).getTime()
    const ageMs = Date.now() - createdAt
    if (ageMs < 60_000) {
      const admin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { data: already } = await admin
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'signup_alerted')
        .maybeSingle()

      if (!already) {
        const dateStr = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
        await sendWhatsAppAlert(
          `🆕 רישום חדש ל-Adigo\n\n` +
          `אימייל: ${user.email ?? '—'}\n` +
          `שם: ${user.user_metadata?.full_name ?? '—'}\n` +
          `שעה: ${dateStr}`
        )
        await logEvent(user.id, 'signup_alerted', { email: user.email })
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
