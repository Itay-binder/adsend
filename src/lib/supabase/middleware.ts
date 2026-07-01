import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isHeLanding = path === '/login' || path === '/lp-he'
  const isEnLanding = path === '/lp-en'
  const isAuthPage = isHeLanding || isEnLanding
  const isSubscribePage = path.startsWith('/subscribe')
  const isDashboardHe = path.startsWith('/dashboard') && !path.startsWith('/dashboard-en')
  const isDashboardEn = path.startsWith('/dashboard-en')
  const isConnectPage = path.startsWith('/connect') || path.startsWith('/academy') || path.startsWith('/settings')
  const isDashboard = isDashboardHe || isDashboardEn || isConnectPage

  const locale: 'en' | 'he' =
    (user?.user_metadata?.locale as 'en' | 'he') ??
    (isEnLanding || isDashboardEn ? 'en' : 'he')

  // Gate: unauthenticated users bounced from dashboard back to their landing.
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL(locale === 'en' ? '/lp-en' : '/lp-he', request.url))
  }

  // Logged-in users on a landing page → dashboard for their locale.
  if (user && isAuthPage) {
    const target = locale === 'en' ? '/dashboard-en' : '/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // Subscription check for dashboard routes.
  if (user && isDashboard) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, tier')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null
    const isActive = sub && ['active', 'trial'].includes(sub.status) && periodEnd && periodEnd > now
    const isCancelledButValid = sub?.status === 'cancelled' && periodEnd && periodEnd > now

    // English tier ('en_beta') always has access — no Cardcom in the funnel.
    // Hebrew users with no active sub get pushed to /subscribe.
    if (!isActive && !isCancelledButValid && !isSubscribePage) {
      if (locale === 'en') {
        // Should never happen (auth callback auto-creates a sub), but if it
        // did, keep them on their dashboard rather than sending to Cardcom.
        return supabaseResponse
      }
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  return supabaseResponse
}
