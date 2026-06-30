import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BAILEYS_SERVER = process.env.BAILEYS_SERVER_URL ?? 'http://localhost:3001'
// Shared secret so only this app can reach the Baileys server's control endpoints.
const BAILEYS_AUTH = { 'x-api-secret': process.env.BAILEYS_API_SECRET ?? '' }

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${BAILEYS_SERVER}/session/${user.id}/status`, { headers: BAILEYS_AUTH })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'error' })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { phone?: string }

  // Phone pairing mode
  if (body.phone) {
    try {
      const res = await fetch(`${BAILEYS_SERVER}/session/${user.id}/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...BAILEYS_AUTH },
        body: JSON.stringify({ phone: body.phone }),
      })
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ ok: false, error: 'Baileys server unreachable' })
    }
  }

  // QR mode
  try {
    const res = await fetch(`${BAILEYS_SERVER}/session/${user.id}/start`, { method: 'POST', headers: BAILEYS_AUTH })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'error', message: 'Baileys server unreachable' })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${BAILEYS_SERVER}/session/${user.id}`, { method: 'DELETE', headers: BAILEYS_AUTH })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ ok: false, error: 'Baileys server unreachable' }, { status: 500 })
  }
}
