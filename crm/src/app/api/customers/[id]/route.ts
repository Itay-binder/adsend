import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = await request.json() as {
    fullName?: string
    subscription?: {
      status: string; plan: string; amount: number;
      current_period_end: string | null;
    }
  }

  const supabase = createAdminClient()

  if (body.fullName !== undefined) {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: { full_name: body.fullName },
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (body.subscription) {
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: id,
      status: body.subscription.status,
      plan: body.subscription.plan,
      amount: body.subscription.amount,
      currency: 'ILS',
      current_period_end: body.subscription.current_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const supabase = createAdminClient()

  // Delete dependent rows first (FKs without cascade)
  await Promise.all([
    supabase.from('whatsapp_sessions').delete().eq('user_id', id),
    supabase.from('whatsapp_pending').delete().eq('user_id', id),
    supabase.from('whatsapp_allowed_numbers').delete().eq('user_id', id),
    supabase.from('meta_connections').delete().eq('user_id', id),
    supabase.from('ad_accounts').delete().eq('user_id', id),
    supabase.from('uploads').delete().eq('user_id', id),
    supabase.from('subscriptions').delete().eq('user_id', id),
  ])

  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
