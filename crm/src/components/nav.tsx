'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Users, Send, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Nav({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/customers', label: 'לקוחות', icon: Users },
    { href: '/broadcast', label: 'דיוור', icon: Send },
  ]

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#0B1220] border-l border-zinc-800 flex flex-col">
      <div className="p-5 border-b border-zinc-800 flex items-center gap-2.5">
        <Image src="/adigo-icon.png" alt="Adigo" width={32} height={32} className="rounded-md" />
        <div>
          <h1 className="text-xl font-black">
            Adi<span className="text-brand">go</span>
          </h1>
          <p className="text-xs text-zinc-500 leading-none mt-0.5">CRM</p>
        </div>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-800 space-y-2">
        <p className="text-xs text-zinc-500 px-3 truncate">{email}</p>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </button>
      </div>
    </aside>
  )
}
