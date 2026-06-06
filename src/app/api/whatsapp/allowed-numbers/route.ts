import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('whatsapp_allowed_numbers')
    .select('phone_number, label, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ numbers: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone_number, label } = await request.json()
  const clean = phone_number?.replace(/\D/g, '')
  if (!clean || clean.length < 9) return NextResponse.json({ error: 'מספר לא תקין' }, { status: 400 })

  const { error } = await supabase.from('whatsapp_allowed_numbers').upsert(
    { user_id: user.id, phone_number: clean, label: label?.trim() || null },
    { onConflict: 'user_id,phone_number' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone_number } = await request.json()
  const { error } = await supabase.from('whatsapp_allowed_numbers')
    .delete().eq('user_id', user.id).eq('phone_number', phone_number)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
