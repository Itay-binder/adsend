import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Generates a magic link for the target user that, when clicked, signs in
// as that user on the AdSend app. Returns the URL — the client opens it in a new tab.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const supabase = createAdminClient()
  const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(id)
  if (userErr || !user?.email) {
    return NextResponse.json({ error: userErr?.message ?? 'משתמש לא נמצא' }, { status: 404 })
  }

  const adsendUrl = process.env.ADSEND_APP_URL ?? 'https://adsend.vercel.app'

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
    options: { redirectTo: `${adsendUrl}/dashboard` },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ url: data.properties?.action_link, email: user.email })
}
