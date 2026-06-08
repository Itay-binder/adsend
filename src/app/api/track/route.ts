import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'

// Fire-and-forget tracker called from the browser pixel helpers.
// Auth comes from the user's existing Supabase session cookie — anonymous
// events are silently dropped so we never log noise.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true, skipped: 'anonymous' })

  const body = await request.json().catch(() => ({})) as { name?: string; params?: Record<string, unknown> }
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
  }

  await logEvent(user.id, body.name, body.params ?? {})
  return NextResponse.json({ ok: true })
}
