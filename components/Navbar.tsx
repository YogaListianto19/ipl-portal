'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Receipt, LogOut, Users, RefreshCw, ChevronDown, User,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isAdmin, roleLabel } from '@/lib/auth'
import type { Role } from '@/lib/types'

interface NavbarProps {
  name: string
  blok: string
  role: Role
}

const navItems = [
  { href: '/dashboard',    label: 'Tagihan',     icon: Home },
  { href: '/pengeluaran',  label: 'Pengeluaran', icon: Receipt },
]

export function Navbar({ name, blok, role }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/60 shadow-sm shadow-primary/5">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 bg-linear-to-br from-rose-600 to-pink-500 rounded-lg flex items-center justify-center shadow-sm shadow-primary/30">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground hidden xs:block">IPL Rossela</span>
        </Link>

        {/* Nav Links — desktop only */}
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-rose-600 to-pink-500 flex items-center justify-center shadow-sm shadow-primary/30">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-foreground leading-none">{name.split(' ')[0]}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{blok}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            {/* User info header */}
            <div className="px-3 py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-rose-600 to-pink-500 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{name}</p>
                  <p className="text-[11px] text-muted-foreground">{blok}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 text-[10px] h-4">
                {roleLabel(role)}
              </Badge>
            </div>

            <DropdownMenuItem onClick={() => router.push('/profil')} className="flex items-center gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              Profil Saya
            </DropdownMenuItem>

            {isAdmin(role) && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                    Panel Admin
                  </p>
                </div>
                <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Semua Warga
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/sync')} className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="w-4 h-4" />
                  Upload Data
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
