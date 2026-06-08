'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageCircle, BookOpen, Phone, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/connect/whatsapp', label: 'ווצאפ', icon: MessageCircle },
  { href: '/connect/meta', label: 'Meta Ads', icon: LayoutDashboard },
  { href: '/academy', label: 'אקדמיה', icon: BookOpen },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#0B1220] border-l border-zinc-800 flex flex-col">
      <div className="p-5 border-b border-zinc-800 flex items-center gap-2.5">
        <Image src="/adigo-icon.png" alt="Adigo" width={32} height={32} className="rounded-md" />
        <h1 className="text-xl font-black text-white">
          Adi<span className="text-brand">go</span>
        </h1>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <a
          href="https://wa.me/972526660006?text=היי%2C%20אני%20צריך%20עזרה%20עם%20Adigo"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <Phone className="w-4 h-4" />
          דבר עם נציג
        </a>
      </div>
    </aside>
  )
}
