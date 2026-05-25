'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, TrendingDown, Wallet, Receipt, User, ShieldCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAdmin } from '@/lib/auth'
import type { Role } from '@/lib/types'

interface SidebarProps {
  name: string
  blok: string
  role: Role
}

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',        icon: Home,         desc: 'Ringkasan' },
  { href: '/tagihan-ipl',     label: 'Tagihan IPL',      icon: FileText,     desc: 'IPL/TIPL' },
  { href: '/pengeluaran-ipl', label: 'Pengeluaran IPL',  icon: TrendingDown, desc: 'Biaya IPL' },
  { href: '/tagihan-kas',     label: 'Tagihan Kas',      icon: Wallet,       desc: 'TGW/' },
  { href: '/pengeluaran-kas', label: 'Pengeluaran Kas',  icon: Receipt,      desc: 'PW/' },
  { href: '/profil',          label: 'Profil',           icon: User,         desc: 'Akun saya' },
]

const ADMIN_ITEMS = [
  { href: '/admin/dashboard', label: 'Panel Admin',  icon: ShieldCheck, desc: 'Semua warga' },
  { href: '/admin/users',     label: 'Kelola User',  icon: Users,       desc: 'Akses portal' },
]

export function Sidebar({ name, blok, role }: SidebarProps) {
  const pathname = usePathname()
  const admin = isAdmin(role)

  const firstName = name.split(' ')[0]

  function NavItem({ href, label, icon: Icon, desc }: { href: string; label: string; icon: React.ElementType; desc: string }) {
    const isActive = pathname === href ||
      (href !== '/dashboard' && href !== '/admin/dashboard' && pathname.startsWith(href)) ||
      (href === '/admin/dashboard' && pathname.startsWith('/admin') && !pathname.startsWith('/admin/users'))
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer',
          isActive
            ? 'bg-linear-to-r from-rose-600 to-pink-500 shadow-sm shadow-primary/20'
            : 'hover:bg-rose-50/80 text-slate-600 hover:text-rose-700'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-rose-100'
        )}>
          <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-500 group-hover:text-rose-600')} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold leading-tight', isActive ? 'text-white' : '')}>{label}</p>
          <p className={cn('text-[10px] leading-tight', isActive ? 'text-white/65' : 'text-slate-400')}>{desc}</p>
        </div>
      </Link>
    )
  }

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 flex-col bg-white border-r border-rose-100/80 shadow-sm z-40">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-rose-100/60">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-rose-600 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <ellipse cx="12" cy="5" rx="3" ry="5" transform="rotate(0 12 12)" opacity="0.9"/>
            <ellipse cx="12" cy="5" rx="3" ry="5" transform="rotate(72 12 12)" opacity="0.85"/>
            <ellipse cx="12" cy="5" rx="3" ry="5" transform="rotate(144 12 12)" opacity="0.8"/>
            <ellipse cx="12" cy="5" rx="3" ry="5" transform="rotate(216 12 12)" opacity="0.85"/>
            <ellipse cx="12" cy="5" rx="3" ry="5" transform="rotate(288 12 12)" opacity="0.9"/>
            <circle cx="12" cy="12" r="2.5" fill="white" opacity="0.95"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-rose-800 leading-tight truncate">Portal Rossela</p>
          <p className="text-xs text-slate-400 truncate">G-Land Katapang</p>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-3.5 mx-3 mt-3 rounded-xl bg-rose-50/70 border border-rose-100/60">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-rose-500 to-pink-400 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{firstName[0]}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{firstName}</p>
          <p className="text-xs text-slate-500 truncate">Unit {blok}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {NAV_ITEMS.map(item => <NavItem key={item.href} {...item} />)}

        {admin && (
          <>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-2">Admin</p>
            {ADMIN_ITEMS.map(item => <NavItem key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-rose-100/60">
        <p className="text-[10px] text-slate-300 text-center">© {new Date().getFullYear()} Blok Rossela</p>
      </div>
    </aside>
  )
}
