import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'itay@binder.co.il')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isAuthPath = path.startsWith('/login') || path.startsWith('/auth')

  if (!user && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && !isAuthPath) {
    const email = (user.email ?? '').toLowerCase()
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL('/login?denied=1', request.url))
    }
  }

  if (user && path === '/login') {
    const email = (user.email ?? '').toLowerCase()
    if (ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL('/customers', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)'],
}
