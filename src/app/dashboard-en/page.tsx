import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircle, Upload, ArrowRight, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { DashboardTracker } from '@/components/dashboard-tracker'

const BAILEYS = process.env.BAILEYS_SERVER_URL ?? 'http://localhost:3001'

export default async function DashboardEnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/lp-en')

  const [waSession, metaConn, uploads, baileysStatus] = await Promise.all([
    supabase.from('whatsapp_sessions').select('*').eq('user_id', user.id).single(),
    supabase.from('meta_connections').select('*').eq('user_id', user.id).single(),
    supabase.from('uploads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    fetch(`${BAILEYS}/session/${user.id}/status`, { headers: { 'x-api-secret': process.env.BAILEYS_API_SECRET ?? '' } }).then(r => r.json()).catch(() => null),
  ])

  const waConnected = baileysStatus?.status === 'connected' || waSession.data?.status === 'connected'
  const metaConnected = !!metaConn.data

  const uploadsThisWeek = (uploads.data ?? []).filter(u => {
    const d = new Date(u.created_at)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d > weekAgo
  }).length

  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="ltr">
      <DashboardTracker waConnected={waConnected} metaConnected={metaConnected} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Image src="/adigo-icon.png" alt="Adigo" width={40} height={40} className="rounded-full" priority />
          <span className="text-xl font-black text-white">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Hi, {firstName} 👋</h2>
        <p className="text-zinc-400 mt-1">Ready to push some creatives?</p>
      </div>

      {/* Status badges */}
      <div className="flex gap-3 mb-8">
        <Badge className={waConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}>
          <MessageCircle className="w-3 h-3 mr-1" />
          {waConnected ? 'WhatsApp connected ✓' : 'WhatsApp not connected'}
        </Badge>
        <Badge className={metaConnected ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-zinc-800 text-zinc-400'}>
          <span className="text-xs mr-1">f</span>
          {metaConnected ? 'Meta connected ✓' : 'Meta not connected'}
        </Badge>
      </div>

      {/* Onboarding */}
      {!waConnected && (
        <div className="mb-4 p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Connect your WhatsApp</p>
            <p className="text-zinc-400 text-xs mt-0.5">Required to push creatives</p>
          </div>
          <Link href="/connect/whatsapp?lang=en" className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">
            Connect <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {!metaConnected && (
        <div className="mb-4 p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Connect your Meta ad account</p>
            <p className="text-zinc-400 text-xs mt-0.5">Required before pushing creatives</p>
          </div>
          <Link href="/connect/meta?lang=en" className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            Connect <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Uploads this week</p>
          <p className="text-3xl font-black text-white">{uploadsThisWeek}</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Total uploads</p>
          <p className="text-3xl font-black text-white">{uploads.data?.length ?? 0}</p>
        </div>
      </div>

      {/* Ready CTA */}
      {waConnected && metaConnected && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white font-bold">📲 You’re ready to upload!</p>
            <p className="text-zinc-400 text-sm mt-1">Send an image or video to your WhatsApp bot.</p>
            {waSession.data?.phone_number && (
              <p className="text-emerald-400 text-xs mt-1 font-mono">+{waSession.data.phone_number}</p>
            )}
          </div>
          <Upload className="w-8 h-8 text-emerald-400" />
        </div>
      )}

      {/* Recent uploads */}
      {(uploads.data?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">Recent uploads</h3>
          <div className="flex flex-col gap-2">
            {uploads.data!.map(u => (
              <div key={u.id} className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{u.campaign_name}</p>
                  <p className="text-zinc-500 text-xs">{u.adset_name} · {new Date(u.created_at).toLocaleDateString('en-US')}</p>
                </div>
                <Badge className={u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}>
                  {u.status === 'ACTIVE' ? 'Active' : 'Paused'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
