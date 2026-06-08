import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshLongLivedToken } from '@/lib/meta/api'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  if (!code) return NextResponse.redirect(`${appUrl}/connect/meta?error=no_code`)

  try {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI!

    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)

    // Exchange for long-lived token
    const { token, expires } = await refreshLongLivedToken(tokenData.access_token)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${appUrl}/login`)

    // Save connection
    await supabase.from('meta_connections').upsert({
      user_id: user.id,
      access_token: token,
      token_expires_at: expires.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.redirect(`${appUrl}/connect/meta?choose=1&just_connected=1`)
  } catch (err) {
    console.error('Meta OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/connect/meta?error=oauth_failed`)
  }
}
