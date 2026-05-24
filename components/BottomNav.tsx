'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, User, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAdmin } from '@/lib/auth'
import type { Role } from '@/lib/types'

interface BottomNavProps {
  role: Role
}

const BASE_ITEMS = [
  { href: '/dashboard',   label: 'Tagihan',     icon: Home },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { href: '/profil',      label: 'Profil',      icon: User },
]

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()

  const items = isAdmin(role)
    ? [...BASE_ITEMS, { href: '/admin/dashboard', label: 'Admin', icon: ShieldCheck }]
    : BASE_ITEMS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-card/95 backdrop-blur-md border-t border-border/60 shadow-lg shadow-black/5">
      <div className="flex items-stretch h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors touch-manipulation"
            >
              <div className={cn(
                'flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200',
                isActive
                  ? 'bg-linear-to-br from-rose-600 to-pink-500 shadow-sm shadow-primary/30'
                  : ''
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-white' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      <div className="h-safe-area-inset-bottom bg-card/95" />
    </nav>
  )
}
