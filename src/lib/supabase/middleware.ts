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
  const isAuthPage = path.startsWith('/login')
  const isSubscribePage = path.startsWith('/subscribe')
  const isDashboard = path.startsWith('/dashboard') ||
    path.startsWith('/connect') ||
    path.startsWith('/academy') ||
    path.startsWith('/settings')

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check active subscription for dashboard routes
  if (user && isDashboard) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null
    // active/trial = full access; cancelled = access until period end
    const isActive = sub && ['active', 'trial'].includes(sub.status) && periodEnd && periodEnd > now
    const isCancelledButValid = sub?.status === 'cancelled' && periodEnd && periodEnd > now

    if (!isActive && !isCancelledButValid && !isSubscribePage) {
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  return supabaseResponse
}
