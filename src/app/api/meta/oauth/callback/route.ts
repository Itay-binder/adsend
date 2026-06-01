import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshLongLivedToken, getAdAccounts } from '@/lib/meta/api'

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

    // Fetch and save ad accounts
    const accounts = await getAdAccounts(token)
    const active = accounts.filter(a => a.account_status === 1)

    if (active.length > 0) {
      await supabase.from('ad_accounts').upsert(
        active.map(a => ({
          user_id: user.id,
          account_id: a.id,
          account_name: a.name,
          currency: a.currency,
          is_active: true,
        })),
        { onConflict: 'user_id,account_id' }
      )
    }

    return NextResponse.redirect(`${appUrl}/connect/meta?success=1`)
  } catch (err) {
    console.error('Meta OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/connect/meta?error=oauth_failed`)
  }
}
