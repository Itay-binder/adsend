import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscribeClient } from './subscribe-client'

export const dynamic = 'force-dynamic'

export default async function SubscribePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // A row in subscriptions means this user already started/used a trial at some point
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return <SubscribeClient hasUsedTrial={!!sub} />
}
