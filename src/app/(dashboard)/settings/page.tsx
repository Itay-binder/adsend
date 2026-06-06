import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, plan, amount, currency, current_period_start, current_period_end')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="p-8 max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-2">הגדרות</h2>
      <p className="text-zinc-400 mb-8">ניהול מנוי וחשבון</p>
      <SettingsClient
        email={user!.email ?? ''}
        subscription={sub ?? null}
      />
    </div>
  )
}
