import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'itay@binder.co.il')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const email = (user.email ?? '').toLowerCase()
  if (!getAdminEmails().includes(email)) redirect('/login?denied=1')
  return user
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}
