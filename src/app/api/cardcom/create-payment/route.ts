import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentPage } from '@/lib/cardcom'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { url, lowProfileId } = await createPaymentPage(user.id, user.email)
    return NextResponse.json({ url, lowProfileId })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
