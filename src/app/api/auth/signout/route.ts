import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const locale: 'en' | 'he' = user?.user_metadata?.locale === 'en' ? 'en' : 'he'
  await supabase.auth.signOut()

  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/${locale === 'en' ? 'lp-en' : 'lp-he'}`, { status: 303 })
}
