import { createAdminClient } from '@/lib/supabase/admin'

export type Customer = {
  id: string
  email: string
  fullName: string | null
  createdAt: string
  lastSignInAt: string | null
  waPhone: string | null
  waStatus: string | null
  metaConnected: boolean
  adAccountId: string | null
  adAccountName: string | null
  subStatus: string | null
  subPlan: string | null
  subAmount: number | null
  subPeriodEnd: string | null
  uploadsThisMonth: number
  uploadsTotal: number
  lastUploadAt: string | null
}

export async function getAllCustomers(): Promise<Customer[]> {
  const supabase = createAdminClient()

  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const users = authData?.users ?? []

  const userIds = users.map(u => u.id)
  if (!userIds.length) return []

  const [wa, meta, accts, subs, uploads] = await Promise.all([
    supabase.from('whatsapp_sessions').select('user_id,phone_number,status'),
    supabase.from('meta_connections').select('user_id,token_expires_at'),
    supabase.from('ad_accounts').select('user_id,account_id,account_name,is_active'),
    supabase.from('subscriptions').select('user_id,status,plan,amount,current_period_end'),
    supabase.from('uploads').select('user_id,created_at'),
  ])

  const waMap = new Map<string, { phone_number: string; status: string }>()
  ;(wa.data ?? []).forEach(r => waMap.set(r.user_id, r))

  const metaMap = new Map<string, { token_expires_at: string }>()
  ;(meta.data ?? []).forEach(r => metaMap.set(r.user_id, r))

  const acctMap = new Map<string, { account_id: string; account_name: string }>()
  ;(accts.data ?? []).filter(r => r.is_active).forEach(r => acctMap.set(r.user_id, r))

  const subMap = new Map<string, { status: string; plan: string; amount: number; current_period_end: string }>()
  ;(subs.data ?? []).forEach(r => subMap.set(r.user_id, r))

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const uploadStats = new Map<string, { total: number; month: number; last: string | null }>()
  ;(uploads.data ?? []).forEach(r => {
    const stat = uploadStats.get(r.user_id) ?? { total: 0, month: 0, last: null }
    stat.total += 1
    const d = new Date(r.created_at)
    if (d >= monthStart) stat.month += 1
    if (!stat.last || d > new Date(stat.last)) stat.last = r.created_at
    uploadStats.set(r.user_id, stat)
  })

  return users.map(u => {
    const waInfo = waMap.get(u.id)
    const metaInfo = metaMap.get(u.id)
    const acct = acctMap.get(u.id)
    const sub = subMap.get(u.id)
    const upl = uploadStats.get(u.id) ?? { total: 0, month: 0, last: null }
    return {
      id: u.id,
      email: u.email ?? '',
      fullName: (u.user_metadata?.full_name as string) ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      waPhone: waInfo?.phone_number ?? null,
      waStatus: waInfo?.status ?? null,
      metaConnected: !!metaInfo,
      adAccountId: acct?.account_id ?? null,
      adAccountName: acct?.account_name ?? null,
      subStatus: sub?.status ?? null,
      subPlan: sub?.plan ?? null,
      subAmount: sub?.amount ?? null,
      subPeriodEnd: sub?.current_period_end ?? null,
      uploadsThisMonth: upl.month,
      uploadsTotal: upl.total,
      lastUploadAt: upl.last,
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getCustomerDetail(id: string) {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.admin.getUserById(id)
  if (!user) return null

  const [wa, meta, accts, sub, uploads] = await Promise.all([
    supabase.from('whatsapp_sessions').select('*').eq('user_id', id).maybeSingle(),
    supabase.from('meta_connections').select('*').eq('user_id', id).maybeSingle(),
    supabase.from('ad_accounts').select('*').eq('user_id', id),
    supabase.from('subscriptions').select('*').eq('user_id', id).maybeSingle(),
    supabase.from('uploads').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
  ])

  return {
    user,
    waSession: wa.data,
    metaConn: meta.data,
    adAccounts: accts.data ?? [],
    subscription: sub.data,
    uploads: uploads.data ?? [],
  }
}
